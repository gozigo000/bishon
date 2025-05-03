import Title from "./_components/Title";
import FileUploader from "./_components/FileUpDownloader";

export default function Home() {

  return (
    <div className="items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <Title />
      <FileUploader />
    </div>
  );
}
