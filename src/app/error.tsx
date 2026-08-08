"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="tech-frame py-28 text-center">
      <p className="eyebrow text-primary">ERROR</p>
      <h1 className="mt-3 text-4xl font-extrabold">页面暂时不可用</h1>
      <p className="mt-3 text-muted-foreground">
        网络或服务暂时异常，请稍后重试。
      </p>
      <Button className="mt-7" onClick={retry}>
        重试
      </Button>
    </div>
  );
}
