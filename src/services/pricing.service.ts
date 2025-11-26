import { Location, Package, Customer, PackageSize } from '@/types';
import { differenceInDays } from 'date-fns';

export interface PriceCalculation {
  basePrice: number;
  discount: number;
  finalPrice: number;
  days: number;
}

export const calculatePackagePrice = (
  pkg: Package,
  location: Location,
  _customer: Customer
): PriceCalculation => {
  const days = Math.max(1, differenceInDays(new Date(), new Date(pkg.arrivedAt)));
  let basePrice = 0;

  // Apply grace period (convert hours to days)
  const graceDays = location.gracePeriod ? location.gracePeriod / 24 : 0;
  const chargeableDays = Math.max(0, days - graceDays);

  // Calculate base price based on pricing scheme
  switch (location.pricingScheme) {
    case 'flat':
      basePrice = (location.flatDailyPrice || 0) * chargeableDays;
      break;

    case 'progressive':
      // Entry price + (next day price * additional days)
      if (chargeableDays > 0) {
        basePrice = (location.progressiveEntryPrice || 0) + 
                   ((location.progressiveNextDayPrice || 0) * Math.max(0, chargeableDays - 1));
      }
      break;

    case 'flat_size':
      if (location.sizeBasedPrices) {
        basePrice = location.sizeBasedPrices[pkg.size] || 0;
      }
      break;

    case 'progressive_item':
      // First item price + (next item price * additional items)
      // For now, we'll treat it as 1 item per day
      if (chargeableDays > 0) {
        basePrice = (location.progressiveItemFirstPrice || 0) + 
                   ((location.progressiveItemNextPrice || 0) * Math.max(0, chargeableDays - 1));
      }
      break;

    // Legacy support
    default:
      if (location.fixedPrice) {
        basePrice = location.fixedPrice;
      }
      break;
  }

  // No member discount in new system
  const discount = 0;
  const finalPrice = Math.max(0, basePrice - discount);

  return {
    basePrice,
    discount,
    finalPrice,
    days: chargeableDays,
  };
};

export const getSizeLabel = (size: PackageSize, lang: 'en' | 'id'): string => {
  const labels = {
    en: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      extra_large: 'Extra Large',
    },
    id: {
      small: 'Kecil',
      medium: 'Sedang',
      large: 'Besar',
      extra_large: 'Sangat Besar',
    },
  };

  return labels[lang][size];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};
