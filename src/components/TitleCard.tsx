import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";

import { usePostStore } from "@/store/postStore";

const TitleCard = () => {
  const { title, setField } = usePostStore();

  return (
    <Card className="w-full">
      <CardBody>
        <Input
          isRequired
          errorMessage={({ validationDetails, validationErrors }) => {
            if (validationDetails.typeMismatch) {
              return "Please enter a valid email address";
            }

            return validationErrors;
          }}
          label="Title"
          labelPlacement="outside"
          name="title"
          placeholder="Enter product title"
          type="title"
          value={title}
          onChange={(e) => setField("title", e.target.value)}
        />
      </CardBody>
    </Card>
  );
};

export default TitleCard;
