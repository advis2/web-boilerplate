import { useStoreHook } from './storeHook';

let id = 0;
const generateUniqueId = (): string => {
  id += 1;
  return String(id);
};

export function App() {
  const { organizations, addOrganization, removeLastOrganization } =
    useStoreHook();
  const handleAdd = () =>
    addOrganization({ id: generateUniqueId(), name: 'New Org' });
  const handleRemove = () => removeLastOrganization();

  return (
    <div>
      <h1> Organizations</h1>
      <ul>
        {organizations.map((org) => (
          <li key={org.id}>{org.name}</li>
        ))}
      </ul>
      <button key={'add'} onClick={handleAdd}>
        Add New Organization
      </button>
      <button key={'remove'} onClick={handleRemove}>
        Remove Old Organization
      </button>
    </div>
  );
}

export default App;
