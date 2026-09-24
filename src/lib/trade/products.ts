import type {ProductSourceMapping, TradeProduct} from './types';

const eurostat = (codes: string[], codeLabel = codes.join(' + '), scopeNote?: string): ProductSourceMapping => ({codes, codeLabel, commodityField: 'product', scopeNote});
const hmrc = (codes: string[], commodityField: 'Hs6Code' | 'Cn8Code', codeLabel = codes.join(' + '), scopeNote?: string): ProductSourceMapping => ({codes, codeLabel, commodityField, scopeNote});
const both = (codes: string[], codeLabel = codes.join(' + '), scopeNote?: string) => ({
  eurostat: eurostat(codes, codeLabel, scopeNote),
  hmrc: hmrc(codes, codes.every(code => code.length === 8) ? 'Cn8Code' : 'Hs6Code', codeLabel, scopeNote),
});

// CN 2026 / HS mappings verified against the current EU Combined Nomenclature and
// HMRC UK Trade Info commodity model. Broad commercial selections use explicit child
// codes rather than parent+child combinations, preventing statistical double counting.
const products: TradeProduct[] = [
  {id: 'apples', name: 'Apples', mappings: both(['080810'])},
  {id: 'artichokes', name: 'Artichokes', mappings: both(['07099100'])},
  {id: 'asparagus', name: 'Asparagus', mappings: both(['07092000'])},
  {id: 'aubergines', name: 'Aubergines', mappings: both(['070930'])},
  {id: 'avocados', name: 'Avocados', mappings: both(['080440'])},
  {id: 'berries', name: 'Berries', mappings: both(['081020', '081030', '081040'], '081020 + 081030 + 081040', 'Selected berry groups: raspberries/blackberries, currants/gooseberries, cranberries/bilberries and other Vaccinium fruit. Strawberries remain a separate selection.')},
  {id: 'cherries', name: 'Cherries', mappings: both(['080921', '080929'])},
  {id: 'chillies', name: 'Chillies / chilli peppers', mappings: {
    eurostat: eurostat(['07096099'], '07096099', 'CN 07096099 is the residual fresh Capsicum/Pimenta category other than sweet peppers and specified industrial-use lines.'),
    hmrc: hmrc(['07096099'], 'Cn8Code', '07096099', 'UK CN8 07096099 is the residual fresh Capsicum/Pimenta category; it is broader than named chilli varieties.'),
  }, selectorNote: 'broader customs category'},
  {id: 'citrus-fruit', name: 'Citrus fruit', mappings: both(['080510', '080521', '080522', '080529', '080540', '080550', '080590'], '080510 + 080521 + 080522 + 080529 + 080540 + 080550 + 080590', 'Aggregate of non-overlapping HS6 citrus subheadings; specific citrus products remain separately selectable.')},
  {id: 'courgettes', name: 'Courgettes', mappings: both(['07099310'])},
  {id: 'cucumbers', name: 'Cucumbers', mappings: both(['07070005'])},
  {id: 'figs', name: 'Figs', mappings: both(['080420'])},
  {id: 'garlic', name: 'Garlic', mappings: both(['070320'])},
  {id: 'grapefruit', name: 'Grapefruit', mappings: both(['080540'])},
  {id: 'kiwifruit', name: 'Kiwifruit', mappings: both(['081050'])},
  {id: 'lemons-limes', name: 'Lemons / limes', mappings: both(['080550'])},
  {id: 'lettuce', name: 'Lettuce', mappings: both(['070511', '070519'])},
  {id: 'mandarins', name: 'Mandarins / clementines', mappings: both(['080521', '080522', '080529'])},
  {id: 'mangoes', name: 'Mangoes', mappings: both(['080450'], '080450', 'HS/CN 080450 groups guavas, mangoes and mangosteens. The statistics cannot isolate mangoes alone.'), selectorNote: 'broader customs category'},
  {id: 'melons', name: 'Melons (excluding watermelons)', mappings: both(['080719'])},
  {id: 'onions', name: 'Onions', mappings: both(['07031011', '07031019'])},
  {id: 'oranges', name: 'Oranges', mappings: both(['080510'])},
  {id: 'passion-pitahaya', name: 'Passion fruit / pitahaya & related tropical fruit', mappings: {
    eurostat: eurostat(['08109020'], '08109020', 'CN 08109020 groups tamarinds, cashew apples, lychees, jackfruit, sapodilla plums, passion fruit, carambola and pitahaya.'),
    hmrc: hmrc(['081090'], 'Hs6Code', '081090', 'UK HS6 081090 is a broader other-fresh-fruit category and cannot isolate passion fruit or pitahaya individually.'),
  }, selectorNote: 'broader customs category'},
  {id: 'peaches-nectarines', name: 'Peaches / nectarines', mappings: both(['080930'])},
  {id: 'pears', name: 'Pears', mappings: both(['080830'])},
  {id: 'peppers', name: 'Peppers (Capsicum / Pimenta)', mappings: both(['070960'])},
  {id: 'potatoes', name: 'Potatoes (excluding seed)', mappings: both(['070190'])},
  {id: 'specialist-herbs', name: 'Specialist / exotic fresh herbs', mappings: {
    eurostat: eurostat(['07099990'], '07099990', 'CN 07099990 is a broader residual fresh/chilled vegetable category; basil, coriander, mint and Thai basil are not separately identifiable in these trade statistics.'),
    hmrc: hmrc(['07099990'], 'Cn8Code', '07099990', 'UK CN8 07099990 is a broader residual fresh/chilled vegetable category; individual fresh herbs cannot be isolated reliably.'),
  }, selectorNote: 'broader customs category'},
  {id: 'strawberries', name: 'Strawberries', mappings: both(['081010'])},
  {id: 'table-grapes', name: 'Table grapes', mappings: both(['08061010'])},
  {id: 'tomatoes', name: 'Tomatoes', mappings: both(['070200'])},
  {id: 'watermelons', name: 'Watermelons', mappings: both(['080711'])},
];

export const TRADE_PRODUCTS = products.slice().sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

export function getTradeProduct(id: string) {
  return TRADE_PRODUCTS.find(product => product.id === id) ?? null;
}

export function getProductMapping(product: TradeProduct, provider: 'eurostat' | 'hmrc') {
  return product.mappings[provider] ?? null;
}
