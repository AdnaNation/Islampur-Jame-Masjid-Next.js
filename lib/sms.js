export async function sendSms(number, message) {
  const payload = {
    UserName: `${process.env.API_USERNAME}`,
    Apikey: `${process.env.API_KEY}`,
    MobileNumber: `88${number}`,
    CampaignId: "Islampur Jame Masjid",
    SenderName: "8809601004618",
    TransactionType: "T",
    Message: message,
  };

  const response = await fetch("https://api.mimsms.com/api/SmsSending/SMS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
