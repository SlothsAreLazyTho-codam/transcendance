"use client";

import { Avatar, useAvatar } from "@/components/ui/avatar";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdateImageForm() {
  const { avatar, setAvatar, reloadAvatar, uploadAvatar } = useAvatar();
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const changePreview = (file: File | Blob) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      setAvatar(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const load = () => {
    reloadAvatar().then((x) => setAvatar(avatar));
  };

  const upload = async (data: HTMLFormElement) => {
    return uploadAvatar(new FormData(data)).then((rsp) => {
      load();
      return rsp?.ok;
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
      <Avatar />
      <div>
        {message && (
          <div className="flex flex-row items-center gap-x-1">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <h1 className="text-green-500 text-xl">{message}</h1>
          </div>
        )}

        {error && (
          <div className="flex flex-row items-center gap-x-1">
            <XCircleIcon className="w-6 h-6 text-red-500" />
            <h1 className="text-red-500 text-xl">{error}</h1>
          </div>
        )}
        <form
          className="flex flex-wrap gap-2 p-4 bg-black/10 shadow-sm shadow-black rounded-lg items-center"
          onSubmit={(form) => {
            form.preventDefault();
            upload(form.currentTarget).then((ok) => {
              if (ok) {
                setMessage(
                  "Avatar succesfully changed. Refresh the page if you don't see it."
                );
                setError(undefined);
              } else {
                setError("Couldn't upload image, make sure its an image!");
                setMessage(undefined);
              }

              router.refresh();
            });
          }}
        >
          <input
            className="p-2 text-2xl font-bold transition-colors duration-300 bg-neutral-800 hover:bg-neutral-500 hover:text-black w-full sm:w-auto"
            type="file"
            name="file"
            accept="image/png, image/gif, image/jpeg"
            onChange={(e) => {
              const targetFile = e!.target!.files?.item(0);

              if (!targetFile) {
                return;
              }

              changePreview(targetFile);
            }}
          />
          <button className="px-4 p-2 m-1 rounded-lg text-2xl font-bold transition-colors duration-300 bg-blue-500/50 hover:bg-cyan-300/90 hover:text-black">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
