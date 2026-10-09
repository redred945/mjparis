/* Configuration unique du site MJ Paris.
   formEndpoint : URL d'un service de formulaire (ex. Formspree, Getform...) qui accepte un POST JSON.
                  Laisser vide = repli sur mailto: (le client mail du visiteur s'ouvre, pré-rempli).
   TODO-CLIENT : choisir le service d'envoi et renseigner l'URL ici. */
window.MJ_CONFIG = {
  formEndpoint: "",
  mailTo: "info@mj-paris.fr",
  phone: "07 51 88 88 88",
  thanksUrl: "/merci/"
};
