import { Card, CardBody, CardHeader } from "@heroui/card";
import MDEditor from "@uiw/react-md-editor";

import { usePostStore } from "@/store/postStore";

const DescriptionCard = () => {
  const { description, setField } = usePostStore();

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Description</h3>
      </CardHeader>
      <CardBody>
        <MDEditor
          data-color-mode="light"
          value={description}
          onChange={(val) => setField("description", val ?? "")}
        />
      </CardBody>
    </Card>
  );
};

export default DescriptionCard;
