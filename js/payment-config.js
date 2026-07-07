window.FRESCOO_PAYMENTS = {
  provider: "stripe-payment-links",
  currency: "EUR",

  // Colle ici les liens Stripe Payment Links de chaque produit.
  // Exemple : cooltouch-1700: "https://buy.stripe.com/xxxx"
  productLinks: {
    "cooltouch-1700": "",
    "lumicool-led": "",
    "clearbreeze-usb": ""
  },

  // Optionnel : lien Stripe pour un panier complet ou une page de paiement globale.
  cartCheckoutLink: ""
};
