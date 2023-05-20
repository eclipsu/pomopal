import Image from "next/image";
import Link from "next/link";
import tomatoPic from "@/assets/tomato.png";

export default function Home() {
  return (
    <>
      <main className=" h-screen flex flex-col items-center my-auto p-24 ">
        <div className="relative">
          <Image
            className="cursor-pointer shadow-2xl rounded-full hover:animate-bounce"
            src={tomatoPic}
            alt="Picture of construction guy"
            width={200}
            height={200}
          />
        </div>
        <div className="font-bold text-xl flex flex-col items-center">
          <h1 className="mt-14">Site is under construction 🚧</h1>
          <h1 className="mt-3">
            Join our{" "}
            <Link className="border-b-2" href="https://discord.gg/x499GtTcEq">
              Discord
            </Link>{" "}
            To get Updated
          </h1>
        </div>
      </main>
    </>
  );
}
