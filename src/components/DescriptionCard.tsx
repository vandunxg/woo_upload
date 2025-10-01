import { usePostStore } from "@/store/postStore";
import { Card, CardBody } from "@heroui/card";
import MDEditor from "@uiw/react-md-editor";

const DescriptionCard = () => {
  const { description, setField } = usePostStore();
  return (
    <Card className="w-full">
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
