/**
 * Temporary frontend-only donation payment methods.
 *
 * STEM Girls Connect has applied for MTN and Orange Money cash collection
 * services and is awaiting approval. Until that backend exists, the site
 * simply displays the current public numbers for manual transfer. This
 * will be replaced once a proper payment backend is built.
 */
export const paymentMethods = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    number: '+237 678 55 97 39',
    action: 'tel:*126*1*678559739#',
    color: 'border-yellow-100',
    btnText: 'Donate Now',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    number: '+237 657 65 27 33',
    action: 'tel:*150*1*1*657652733#',
    color: 'border-orange-100',
    btnText: 'Donate Now',
  },
] as const;
