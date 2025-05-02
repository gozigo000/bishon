import Image from "next/image";
import FileUploader from "./(components)/FileUploader";

export default function Home() {
  return (
    <div className="items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main>
        <FileUploader />
      </main>
    </div>
  );
}
