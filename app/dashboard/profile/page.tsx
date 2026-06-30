import { currentUser } from "@clerk/nextjs/server";
import ProfileClient from "@/components/profile-client";

export default async function MyProfileDashboard() {
  const user = await currentUser();
  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "";
  const email = user?.emailAddresses[0]?.emailAddress || null;

  const metadata = user?.publicMetadata || {};
  const phone = user?.phoneNumbers[0]?.phoneNumber || (metadata.phoneNumber as string) || null;
  const dob = (metadata.dob as string) || "1985-05-12";
  const gender = (metadata.gender as string) || "Male";
  const nationality = (metadata.nationality as string) || "Kenyan";

  const imageUrl =
    user?.imageUrl ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAgNLrrn3LbtniV8TsotOZQz36_cYux060GeKaU1QnPNfaPyCqmeWVDF-OrJGhShnq3wqWIOBkPYIPIKNiZfwok3wtlKxsFdxSrFPmcS5p1Up28JeBKT0rYDVI9a-hKnIHaCRnaOZ7SKUQO0HSjA5p7xDzE7GyrMa6E6K0it85ZwvxA8YxWLmkHkSU9QYAJOUOWw-cRPETasn1Sq9IxvfUTNPDgELqIgDcZmK8wTSrSUIML13HInQREaR0dtxff5SZuSeZROS0_Ecro";

  return (
    <ProfileClient
      fullName={fullName}
      email={email}
      phone={phone}
      imageUrl={imageUrl}
      initialDob={dob}
      initialGender={gender}
      initialNationality={nationality}
    />
  );
}
