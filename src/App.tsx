import { useState } from "react";
import { Button } from "./components/ui/button";
import Type1 from "./tab/type1";
import Type2 from "./tab/type2";

function App() {
  const [tab, setTab] = useState<1 | 2>(1);

  return (
    <>
      <Button onClick={() => setTab(1)}>1</Button>
      <Button onClick={() => setTab(2)}>2</Button>
      {tab === 1 ? <Type1 id={"1"} /> : <Type2 id={"2"} />}
    </>
  );
}

export default App;
