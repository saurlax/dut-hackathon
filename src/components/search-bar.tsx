import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function SearchBar({
  defaultValue = "",
  placeholder = "搜索…",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <form className="mb-6 flex max-w-xl gap-2">
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} />
      <Button type="submit">
        <Search />
        搜索
      </Button>
    </form>
  );
}
