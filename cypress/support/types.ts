export interface ProductVariables {
  categories: {
    phones: string;
    laptops: string;
  };
  productIndexes: {
    firstPhone: number;
    secondLaptop: number;
  };
  alerts: {
    productAdded: string;
  };
  navigation: {
    home: string;
    cart: string;
  };
}
