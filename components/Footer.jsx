import Link from "next/link";
import Image from "next/image";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6";

// Add `links` for a developer by pushing { Icon, href, label } items.
const DEVELOPERS = [
  {
    name: "Azizul Islam Adnan",
    avatar: "https://avatars.githubusercontent.com/u/145375204?v=4",
    email: "azizulislamadnan@gmail.com",
    links: [
      {
        Icon: FaFacebookF,
        href: "https://www.facebook.com/AdnaNation.Me",
        label: "Facebook",
      },
      {
        Icon: FaXTwitter,
        href: "https://x.com/AzizuIslamAdnan",
        label: "X",
      },
      {
        Icon: FaInstagram,
        href: "https://www.instagram.com/azizul_islam_adnan",
        label: "Instagram",
      },
    ],
  },
  {
    name: "Muhammed Mehedi Hasan",
    avatar: "https://avatars.githubusercontent.com/u/108600250?v=4",
    email: "muhammedmehedih@gmail.com",
    links: [],
  },
];

const Footer = () => {
  return (
    <footer className="text-white bg-[#0a2c21]">
      <div className="max-w-4xl px-4 py-10 mx-auto">
        {/* Mosque */}
        <div className="text-center">
          <Image
            src="/logo.jpg"
            alt="ইসলামপুর জামে মসজিদ"
            width={56}
            height={56}
            className="mx-auto mb-3 rounded-full ring-2 ring-white/20"
          />
          <h2 className="text-lg font-bold">ইসলামপুর জামে মসজিদ</h2>
          <p className="mt-1 text-sm text-white/60">দুধমুখা, দাগনভূঞা, ফেনী</p>
          <div className="flex justify-center gap-5 mt-4 text-sm">
            <Link href="/pay" className="text-amber-300 hover:underline">
              চাঁদা পরিশোধ
            </Link>
            <Link href="/payment" className="text-amber-300 hover:underline">
              পেমেন্ট হিস্টোরি
            </Link>
          </div>
        </div>

        <div className="h-px my-8 bg-white/10" />

        {/* Developers */}
        <p className="mb-4 text-xs tracking-widest text-center uppercase text-white/50">
          Developed by
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEVELOPERS.map((dev) => (
            <div
              key={dev.name}
              className="flex items-center min-w-0 gap-4 p-4 rounded-xl bg-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dev.avatar}
                alt={dev.name}
                width={64}
                height={64}
                loading="lazy"
                className="object-cover w-16 h-16 rounded-full shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold leading-snug">{dev.name}</h3>
                <a
                  href={`mailto:${dev.email}`}
                  className="flex items-start gap-1.5 mt-1 text-xs break-all text-white/70 hover:text-white"
                >
                  <FaEnvelope className="mt-0.5 shrink-0" />
                  {dev.email}
                </a>
                {dev.links.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {dev.links.map(({ Icon, href, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${dev.name} on ${label}`}
                        className="flex items-center justify-center w-8 h-8 text-sm rounded-full bg-white/10 hover:bg-white/20"
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-center text-white/40">
          &copy; {new Date().getFullYear()} Islampur Jame Masjid. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};
export default Footer;
