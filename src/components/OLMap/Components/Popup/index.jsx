import { Flex, Typography } from "antd";
import React from "react";

const MPopup = React.forwardRef(({ data }, ref) => {
  return (
    <Flex
      vertical
      gap={2}
      ref={ref}
      className="absolute w-fit !max-w-[50vw] bg-white rounded-md shadow-[0 2px 8px rgba(0,0,0,0.2)] !p-2 "
    >
      {data && (
        <>
          <Typography.Text strong className="!text-md text-nowrap text-center">
            Thông tin
          </Typography.Text>

          <Flex vertical className="">
            {Object.entries(data)
              .filter(([k]) => k !== "geometry")
              .map(([k, v]) => (
                <Flex key={k} gap={6} align="center" className="text-nowrap">
                  <Typography.Text strong>
                    {`${k}:`}
                  </Typography.Text>
                  <Typography >{`${String(v)}`}</Typography>
                </Flex>
              ))}
          </Flex>
        </>
      )}
    </Flex>
  );
});

export default MPopup;
