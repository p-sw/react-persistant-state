import { Input } from "@/components/ui/input";
import { usePersistantState } from "@/store";

interface Type2State {
  formValue: number;
}

export default function Type1({ id }: { id: string }) {
  const [state, setState] = usePersistantState<Type2State>(id, {
    formValue: 2,
  });

  return (
    <main>
      <Input
        value={state.formValue}
        onChange={(e) => {
          const v = e.currentTarget.valueAsNumber;
          setState((p) => ({ ...p, formValue: v }));
        }}
      />
    </main>
  );
}
