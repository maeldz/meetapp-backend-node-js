import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import Mail from "../../lib/Mail";

class SubscriptionMail {
  get key() {
    return "SubscriptionMail";
  }

  async handle({ data }) {
    const { organizerName, organizerEmail, meetupTitle, subscriberName } = data;

    await Mail.sendMail({
      to: `${organizerName} <${organizerEmail}>`,
      subject: "Novo inscrito",
      template: "subscription",
      context: {
        organizer: organizerName,
        meetup: meetupTitle,
        subscriber: subscriberName,
        date: format(new Date(), "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: ptBR
        })
      }
    });
  }
}

export default new SubscriptionMail();
