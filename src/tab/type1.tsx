import { Input } from "@/components/ui/input";
import { usePersistantState } from "@/store";

interface Type1State {
  formValue: string;
}

export default function Type1({ id }: { id: string }) {
  const [state, setState] = usePersistantState<Type1State>(id, {
    formValue: "testDefault",
  });

  return (
    <main>
      <Input
        value={state.formValue}
        onChange={(e) => {
          const v = e.currentTarget.value;
          setState((p) => ({ ...p, formValue: v }));
        }}
      />
    </main>
  );
}
