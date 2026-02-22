import React from "react";
import GlobalLayout from "./GlobalLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>
        <GlobalLayout>{children}</GlobalLayout>
      </body>
    </html>
  );
}
