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
  customer: Customer
): PriceCalculation => {
  const days = Math.max(1, differenceInDays(new Date(), new Date(pkg.arrivedAt)));
  let basePrice = 0;

  // Calculate base price based on pricing scheme
  switch (location.pricingScheme) {
    case 'fixed':
      basePrice = location.fixedPrice || 0;
      break;

    case 'progressive':
      if (location.progressiveTiers && location.progressiveTiers.length > 0) {
        // Find the appropriate tier
        const sortedTiers = [...location.progressiveTiers].sort((a, b) => b.days - a.days);
        const tier = sortedTiers.find((t) => days >= t.days) || sortedTiers[sortedTiers.length - 1];
        basePrice = tier.price;
      }
      break;

    case 'size_based':
      if (location.sizeBasedPrices) {
        basePrice = location.sizeBasedPrices[pkg.size] || 0;
      }
      break;
  }

  // Apply member discount
  let discount = 0;
  if (customer.isPremiumMember && location.memberDiscount) {
    discount = (basePrice * location.memberDiscount) / 100;
  }

  const finalPrice = basePrice - discount;

  return {
    basePrice,
    discount,
    finalPrice,
    days,
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
