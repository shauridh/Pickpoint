import { Location, Package, PackageStatus, PricingScheme, Recipient } from '../types';

export const calculatePrice = (
    targetPackage: Package,
    allPackages: Package[],
    location: Location,
    recipient: Recipient,
    pickupDate: Date = new Date()
): number => {
    if (!location || !location.pricing_config) {
        return 0;
    }
    
    const now = pickupDate;
    const isSubscribed = recipient.subscription_start_date &&
                         recipient.subscription_end_date &&
                         new Date(recipient.subscription_start_date) <= now &&
                         new Date(recipient.subscription_end_date) >= now;

    if (isSubscribed) {
        return 0;
    }

    // --- Logic for expired subscriptions ---
    const subscriptionEndDate = recipient.subscription_end_date ? new Date(recipient.subscription_end_date) : null;
    const packageCreationDate = new Date(targetPackage.created_at);
    let billingStartDate = packageCreationDate;

    // If a subscription existed, expired, and the package arrived during or before the subscription period...
    if (subscriptionEndDate && subscriptionEndDate < now && packageCreationDate <= subscriptionEndDate) {
        // ...then the billing should start the day after the subscription ended.
        const dayAfterExpiry = new Date(subscriptionEndDate);
        dayAfterExpiry.setDate(dayAfterExpiry.getDate() + 1);
        dayAfterExpiry.setHours(0, 0, 0, 0); // Start of the day
        billingStartDate = dayAfterExpiry;
    }
    
    const timeDiff = pickupDate.getTime() - billingStartDate.getTime();
    // Ensure daysStored is not negative if pickup happens on the billingStartDate
    const daysStored = timeDiff < 0 ? 0 : Math.ceil(timeDiff / (1000 * 3600 * 24));


    switch (location.pricing_scheme) {
        case PricingScheme.FLAT_PER_COLLECT: {
            const { flat_rate = 0, free_days = 0 } = location.pricing_config;
            return daysStored > free_days ? flat_rate : 0;
        }
        case PricingScheme.PROGRESSIVE_DAILY: {
            const { first_day_fee = 0, subsequent_day_fee = 0 } = location.pricing_config;
            
            if (daysStored <= 0) {
                return 0;
            }
            if (daysStored === 1) {
                return first_day_fee;
            }
            return first_day_fee + (daysStored - 1) * subsequent_day_fee;
        }
        case PricingScheme.MULTI_PACKAGE_DISCOUNT: {
            const { multi_package_first_fee = 0, multi_package_subsequent_fee = 0 } = location.pricing_config;

            const pickupDayStart = new Date(pickupDate);
            pickupDayStart.setHours(0, 0, 0, 0);
            
            const pickupDayEnd = new Date(pickupDate);
            pickupDayEnd.setHours(23, 59, 59, 999);

            // Find other packages from the same recipient picked up today
            const otherPackagesPickedUpToday = allPackages.filter(p => {
                if (
                    p.id === targetPackage.id || // Exclude self
                    p.recipient_id !== targetPackage.recipient_id || // Must be same recipient
                    p.status !== PackageStatus.PICKED_UP || // Must be already picked up
                    !p.picked_at // Must have a pickup date
                ) {
                    return false;
                }
                const pickedAtDate = new Date(p.picked_at);
                return pickedAtDate >= pickupDayStart && pickedAtDate <= pickupDayEnd;
            });
            
            // If no other packages were picked up today, this is the first one.
            return otherPackagesPickedUpToday.length === 0 ? multi_package_first_fee : multi_package_subsequent_fee;
        }
        default:
            return 0;
    }
};