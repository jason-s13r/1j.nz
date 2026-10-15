import { Expense, Deduction } from "../domain/calculate";
import { formatCurrency } from "../utils/format";
import { FormulaInput } from "./FormulaInput";
import { RemoveIcon } from "./icons";
import { Toggle } from "./Toggle";

interface EditableItemRowProps<T extends Expense | Deduction> {
  item: T;
  amount: number;
  onUpdate: (patch: Partial<T>) => void;
  onRemove: () => void;
}

function EditableItemRow<T extends Expense | Deduction>({
  item,
  amount,
  onUpdate,
  onRemove,
}: EditableItemRowProps<T>) {
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
          onChange={(checked) => onUpdate({ enabled: checked } as Partial<T>)}
          label={
            <input
              className="inline-name"
              value={item.name}
              onChange={(e) => onUpdate({ name: e.target.value } as Partial<T>)}
            />
          }
        />
      </td>
      <td className="numeric item-amount-cell">
        <FormulaInput
          value={item.amount}
          formula={item.formula}
          onChange={(amount, formula) => onUpdate({ amount, formula } as Partial<T>)}
          computed={amount}
        />
      </td>
      <td></td>
    </tr>
  );
}

interface ItemListSectionProps<T extends Expense | Deduction> {
  title: string;
  items: T[];
  total: number;
  amounts: Record<string, number>;
  onChange: (items: T[]) => void;
  addLabel: string;
}

export function ItemListSection<T extends Expense | Deduction>({
  title,
  items,
  total,
  amounts,
  onChange,
  addLabel,
}: ItemListSectionProps<T>) {
  const update = (id: string, patch: Partial<T>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), name: "New item", amount: 0, enabled: true } as T,
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
