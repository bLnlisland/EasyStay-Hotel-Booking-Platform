import { DatePicker, Space, Grid } from "antd";
import moment from "moment";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function MobileDateRange({ query, updateQuery }) {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const toMoment = (s) => (s ? moment(s, "YYYY-MM-DD") : null);

  const checkIn = toMoment(query?.check_in);
  const checkOut = toMoment(query?.check_out);

  if (isMobile) {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <DatePicker
          style={{ width: "100%" }}
          inputReadOnly
          placeholder="入住日期"
          value={checkIn}
          onChange={(d) =>
            updateQuery({ check_in: d ? d.format("YYYY-MM-DD") : null })
          }
        />

        <DatePicker
          style={{ width: "100%" }}
          inputReadOnly
          placeholder="离店日期"
          value={checkOut}
          disabledDate={(d) =>
            checkIn ? d.isBefore(checkIn, "day") : false
          }
          onChange={(d) =>
            updateQuery({ check_out: d ? d.format("YYYY-MM-DD") : null })
          }
        />
      </Space>
    );
  }

  return (
    <RangePicker
      style={{ width: "100%" }}
      value={[checkIn, checkOut]}
      onChange={(dates) => {
        if (!dates)
          return updateQuery({ check_in: null, check_out: null });
        updateQuery({
          check_in: dates[0].format("YYYY-MM-DD"),
          check_out: dates[1].format("YYYY-MM-DD"),
        });
      }}
    />
  );
}