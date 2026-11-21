const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function ProductTable({ products }: { products: Product[] }) {
  return (
    <table>
      <caption>Productos</caption>
      <thead>
        <tr>
          <th scope="col">Nombre</th>
          <th scope="col">Descripción</th>
          <th scope="col">Precio</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.description}</td>
            <td>{cop.format(product.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
