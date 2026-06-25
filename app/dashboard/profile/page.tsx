import { currentUser } from "@clerk/nextjs/server";
import ProfileClient from "@/components/profile-client";

export default async function MyProfileDashboard() {
  const user = await currentUser();
  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "Taxpayer";
  const email = user?.emailAddresses[0]?.emailAddress || null;
  const phone = user?.phoneNumbers[0]?.phoneNumber || null;
  const imageUrl =
    user?.imageUrl ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAgNLrrn3LbtniV8TsotOZQz36_cYux060GeKaU1QnPNfaPyCqmeWVDF-OrJGhShnq3wqWIOBkPYIPIKNiZfwok3wtlKxsFdxSrFPmcS5p1Up28JeBKT0rYDVI9a-hKnIHaCRnaOZ7SKUQO0HSjA5p7xDzE7GyrMa6E6K0it85ZwvxA8YxWLmkHkSU9QYAJOUOWw-cRPETasn1Sq9IxvfUTNPDgELqIgDcZmK8wTSrSUIML13HInQREaR0dtxff5SZuSeZROS0_Ecro";

  return (
    <ProfileClient
      fullName={fullName}
      email={email}
      phone={phone}
      imageUrl={imageUrl}
    />
  );
}
