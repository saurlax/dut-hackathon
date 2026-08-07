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
    <form className="mb-8 flex max-w-2xl gap-2 rounded-lg border border-primary/15 bg-white/70 p-3 shadow-xs backdrop-blur-sm">
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="bg-white/80"
      />
      <Button type="submit">
        <Search />
        搜索
      </Button>
    </form>
  );
}
