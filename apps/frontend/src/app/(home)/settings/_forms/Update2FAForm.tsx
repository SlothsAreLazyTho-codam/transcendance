"use client";

import {
  Dialog,
  DialogContent,
  DialogOpenButton,
} from "@/components/ui/dialog";
import { SetupTwoFactorAuthentication } from "@/lib/actions/(auth)/2fa.action";
import { useSession } from "@/lib/context/auth.context";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";

export default function Update2FAForm() {
  const { client } = useSession();
  const [qrCode, setQRCode] = useState<string | undefined>();
  const [state, formAction] = useActionState(SetupTwoFactorAuthentication, {
    error: null,
  });

  useEffect(() => {
    client
      .get("/api/v1/auth/2fa/qrcode", {})
      .then((x) => x.text())
      .then((x) => setQRCode(x));
  }, []);

  return (
    <>
      <Dialog>
        <DialogOpenButton className="px-6 py-2 bg-primary rounded-lg">
          Setup 2 Factor Authentication
        </DialogOpenButton>
        <DialogContent>
          {qrCode && (
            <div className="flex flex-col justify-center items-center">
              <h1>Scan the QR Code!</h1>
              <form
                className="flex flex-col justify-center items-center"
                action={formAction}
              >
                <Image
                  className="flex items-center justify-center"
                  src={qrCode}
                  width={128}
                  height={128}
                  alt="qrcode"
                />
                {state.error && (
                  <h1 className="text-red-500 text-2xl">{state.error}</h1>
                )}
                <div className="flex flex-row justify-center items-center">
                  <input
                    className="border border-white py-1 m-2 pl-1 mr-0 text-black bg-white/50"
                    name="otp"
                    type="text"
                    placeholder="123456"
                  />
                  <button className="px-4 py-1 bg-primary rounded-r-lg">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
