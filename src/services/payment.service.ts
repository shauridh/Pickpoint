import { calculatePackagePrice } from '@/services/pricing.service';
import { Package, Customer, Location } from '@/types';

export interface CreateInvoiceParams {
  pkg: Package;
  customer: Customer;
  location: Location;
}

export const createXenditInvoice = async ({ pkg, customer, location }: CreateInvoiceParams) => {
  const pricing = calculatePackagePrice(pkg, location, customer);

  const body = {
    external_id: `PKG-${pkg.id}`,
    amount: pricing.finalPrice,
    description: `Pembayaran paket ${pkg.trackingNumber} (${customer.name})`,
    payer_email: customer.email || undefined,
    customer: {
      given_names: customer.name,
      email: customer.email,
      mobile_number: customer.phone,
    },
    package: {
      trackingNumber: pkg.trackingNumber,
    },
  };

  const resp = await fetch('/api/payments/xendit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err);
  }

  const data = await resp.json();
  return data.invoice; // includes invoice_url
};
