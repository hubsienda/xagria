import type {TradeProduct, TradeProviderId} from './types';

const both = (codes: string[], codeLabel: string, note?: string) => ({
  eurostat: {codes, codeLabel, note},
  hmrc: {codes, codeLabel, note},
});

const PRODUCTS: TradeProduct[] = [
  {id: 'apples', name: 'Apples', sources: both(['080810'], '080810')},
  {id: 'artichokes', name: 'Artichokes', sources: both(['07099100'], '07099100')},
  {id: 'asparagus', name: 'Asparagus', sources: both(['07092000'], '07092000')},
  {id: 'aubergines', name: 'Aubergines', sources: both(['07093000'], '07093000')},
  {id: 'avocados', name: 'Avocados', sources: both(['080440'], '080440')},
  {id: 'berries', name: 'Berries', sources: both(['081020', '081030', '081040'], '081020 + 081030 + 081040', 'Fresh raspberries/blackberries/mulberries/loganberries, currants/gooseberries, and Vaccinium berries; strawberries remain a separate selection.')},
  {id: 'cherries', name: 'Cherries', sources: both(['080921', '080929'], '080921 + 080929')},
  {id: 'chillies-other-non-sweet-peppers', name: 'Chillies / other non-sweet peppers', sources: both(['07096099'], '07096099', 'Customs classification covers non-sweet Capsicum/Pimenta other than product for industrial capsaicin/oleoresin manufacture; it is broader than chilli peppers alone.')},
  {id: 'citrus-fruit', name: 'Citrus fruit', sources: both(['0805'], '0805', 'Broad citrus customs heading; specific citrus products remain available separately.')},
  {id: 'courgettes', name: 'Courgettes', sources: both(['07099310'], '07099310')},
  {id: 'cucumbers', name: 'Cucumbers', sources: both(['07070005'], '07070005')},
  {id: 'figs', name: 'Figs', sources: both(['08042010'], '08042010', 'Fresh figs only.')},
  {id: 'garlic', name: 'Garlic', sources: both(['070320'], '070320')},
  {id: 'grapefruit', name: 'Grapefruit', sources: both(['080540'], '080540')},
  {id: 'kiwifruit', name: 'Kiwifruit', sources: both(['081050'], '081050')},
  {id: 'lemons-limes', name: 'Lemons / limes', sources: both(['080550'], '080550')},
  {id: 'lettuce', name: 'Lettuce', sources: both(['070511', '070519'], '070511 + 070519')},
  {id: 'mandarins', name: 'Mandarins / clementines', sources: both(['080521', '080522', '080529'], '080521 + 080522 + 080529')},
  {id: 'mangoes-group', name: 'Mangoes / guavas / mangosteens', sources: both(['08045000'], '08045000', 'Official customs line combines fresh or dried guavas, mangoes and mangosteens; mangoes cannot be isolated reliably.')},
  {id: 'melons', name: 'Melons', sources: both(['080719'], '080719', 'Melons excluding watermelons.')},
  {id: 'onions', name: 'Onions', sources: both(['07031011', '07031019'], '07031011 + 07031019')},
  {id: 'oranges', name: 'Oranges', sources: both(['080510'], '080510')},
  {id: 'passion-pitahaya-group', name: 'Passion fruit / pitahaya and related tropical fruit', sources: both(['08109020'], '08109020', 'Official customs line also includes tamarinds, cashew apples, lychees, jackfruit, sapodillo plums and carambola; passion fruit and pitahaya cannot be isolated reliably.')},
  {id: 'peaches-nectarines', name: 'Peaches / nectarines', sources: both(['080930'], '080930')},
  {id: 'pears', name: 'Pears', sources: both(['080830'], '080830')},
  {id: 'peppers', name: 'Peppers', sources: both(['070960'], '070960', 'Fresh or chilled fruits of the genus Capsicum or Pimenta; a narrower non-sweet selection is also available.')},
  {id: 'potatoes', name: 'Potatoes', sources: both(['070190'], '070190', 'Potatoes excluding seed.')},
  {id: 'strawberries', name: 'Strawberries', sources: both(['081010'], '081010')},
  {id: 'table-grapes', name: 'Table grapes', sources: both(['08061010'], '08061010')},
  {id: 'tomatoes', name: 'Tomatoes', sources: both(['070200'], '070200')},
  {id: 'watermelons', name: 'Watermelons', sources: both(['080711'], '080711')},
];

export const TRADE_PRODUCTS = PRODUCTS.slice().sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

export function getTradeProduct(id: string) {
  return TRADE_PRODUCTS.find(product => product.id === id) ?? null;
}

export function getProductMapping(product: TradeProduct, provider: TradeProviderId) {
  return product.sources[provider] ?? null;
}
