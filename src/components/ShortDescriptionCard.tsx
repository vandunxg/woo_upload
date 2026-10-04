import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";

import { useFillHighlight } from "@/hooks/useFillHighlight";
import { usePostStore } from "@/store/postStore";

const ShortDescriptionCard = () => {
  const { short_description, setField } = usePostStore();
  const cardRef = useFillHighlight("short_description");

  return (
    <Card ref={cardRef} className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Short Description</h3>
      </CardHeader>
      <CardBody>
        <Textarea
          labelPlacement="outside"
          minRows={3}
          name="short_description"
          placeholder="Mô tả ngắn hiển thị ở trang danh sách sản phẩm"
          value={short_description}
          onChange={(e) => setField("short_description", e.target.value)}
        />
      </CardBody>
    </Card>
  );
};

export default ShortDescriptionCard;
