import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import { useFillHighlight } from "@/hooks/useFillHighlight";
import { usePostStore } from "@/store/postStore";

const TitleCard = () => {
  const { title, setField } = usePostStore();
  const cardRef = useFillHighlight("title");

  return (
    <Card ref={cardRef} className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Title</h3>
      </CardHeader>
      <CardBody>
        <Input
          isRequired
          labelPlacement="outside"
          name="title"
          placeholder="Enter product title"
          type="text"
          value={title}
          onChange={(e) => {
            setField("title", e.target.value);
            setField("empty", false);
          }}
        />
      </CardBody>
    </Card>
  );
};

export default TitleCard;
