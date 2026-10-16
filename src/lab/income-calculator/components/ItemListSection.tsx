import { LineItem } from "../domain/calculate";
import { formatCurrency } from "../utils/format";
import { FormulaInput } from "./FormulaInput";
import { RemoveIcon } from "./icons";
import { Toggle } from "./Toggle";

interface EditableItemRowProps {
  item: LineItem;
  amount: number;
  onUpdate: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}

function EditableItemRow({
  item,
  amount,
  onUpdate,
  onRemove,
}: EditableItemRowProps) {
  return (
    <tr className={item.enabled ? "" : "disabled"}>
      <td className="item-cell">
        <button
          className="icon-button remove-row-button"
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
        >
          <RemoveIcon />
        </button>
        <Toggle
          checked={item.enabled}
          onChange={(checked) => onUpdate({ enabled: checked })}
          label={
            <input
              className="inline-name"
              value={item.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          }
        />
      </td>
      <td className="numeric item-amount-cell">
        <FormulaInput
          value={item.amount}
          formula={item.formula}
          onChange={(amount, formula) => onUpdate({ amount, formula })}
          computed={amount}
        />
      </td>
      <td></td>
    </tr>
  );
}

interface ItemListSectionProps {
  title: string;
  items: LineItem[];
  total: number;
  amounts: Record<string, number>;
  onChange: (items: LineItem[]) => void;
  addLabel: string;
}

export function ItemListSection({
  title,
  items,
  total,
  amounts,
  onChange,
  addLabel,
}: ItemListSectionProps) {
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), name: "New item", amount: 0, enabled: true },
    ]);
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <>
      <tr className="section-row">
        <td>
          <h2 className="section-title">{title}</h2>
          {" "}
          <button className="text-button add-button" onClick={add}>
            + {addLabel}
          </button>
        </td>
        <td className="numeric">
          {formatCurrency(total)}
        </td>
        <td></td>
      </tr>
      {items.map((item) => (
        <EditableItemRow
          key={item.id}
          item={item}
          amount={amounts[item.id] ?? item.amount}
          onUpdate={(patch) => update(item.id, patch)}
          onRemove={() => remove(item.id)}
        />
      ))}
    </>
  );
}
