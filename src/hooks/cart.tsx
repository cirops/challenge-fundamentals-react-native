import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsFromStorage) {
        setProducts(JSON.parse(productsFromStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const productsToIncrement = [...products];
      productsToIncrement[productIndex].quantity += 1;

      setProducts(productsToIncrement);
      return AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(productsToIncrement),
      );
      // TODO INCREMENTS A PRODUCT QUANTITY IN THE CART
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        productToAdd => productToAdd.id === product.id,
      );

      if (productIndex >= 0) {
        return increment(product.id);
      }

      const productToAdd = {
        ...product,
        quantity: 1,
      };

      const productsWithNewItem = [...products, productToAdd];

      setProducts(productsWithNewItem);
      return AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(productsWithNewItem),
      );
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const productsToDecrement = [...products];
      productsToDecrement[productIndex].quantity -= 1;

      if (productsToDecrement[productIndex].quantity === 0) {
        productsToDecrement.splice(productIndex, 1);
      }

      setProducts(productsToDecrement);
      return AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(productsToDecrement),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
