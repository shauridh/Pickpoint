import { Location, PackageStatus, PricingScheme } from '../types';

export const calculatePrice = (
    createdAt: string,
    location: Location,
    pickupDate: Date = new Date()
): number => {
    if (!location || !location.pricing_config) {
        return 0;
    }

    const createdDate = new Date(createdAt);
    const timeDiff = pickupDate.getTime() - createdDate.getTime();
    const daysStored = Math.ceil(timeDiff / (1000 * 3600 * 24));

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
        default:
            return 0;
    }
};
