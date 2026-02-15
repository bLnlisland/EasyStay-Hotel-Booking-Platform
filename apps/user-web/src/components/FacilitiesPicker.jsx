import { Space, Tag } from "antd";

export default function FacilitiesPicker({ options = [], value = [], onChange }) {
  const norm = options
    .map((o) =>
      typeof o === "string"
        ? { key: o, label: o, value: o }
        : { key: o.id ?? o.name, label: o.name, value: o.name }
    )
    .filter((x) => x.label);

  const toggle = (v) => {
    const active = value.includes(v);
    const next = active ? value.filter((x) => x !== v) : [...value, v];
    onChange?.(next);
  };

  return (
    <Space wrap>
      {norm.map((item) => (
        <Tag
          key={item.key}
          color={value.includes(item.value) ? "blue" : "default"}
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => toggle(item.value)}
        >
          {item.label}
        </Tag>
      ))}
    </Space>
  );
}
