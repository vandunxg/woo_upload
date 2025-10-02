import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import { usePostStore } from "@/store/postStore";

const TitleCard = () => {
  const { title, setField } = usePostStore();

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Title</h3>
      </CardHeader>
      <CardBody>
        <Input
          isRequired
          errorMessage={({ validationDetails, validationErrors }) => {
            if (validationDetails.typeMismatch) {
              return "Please enter a valid email address";
            }

            return validationErrors;
          }}
          // label="Title"
          labelPlacement="outside"
          name="title"
          placeholder="Enter product title"
          type="title"
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
