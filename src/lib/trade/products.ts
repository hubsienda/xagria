import type {TradeProduct} from './types';

// DS-045409 accepts HS2/4/6 hierarchy codes and CN8 codes. CN8 selections below
// use current/stable fresh-produce lines where a narrower commercial distinction is useful.
// Broader HS6 hierarchy codes are used when they provide the statistically sound product group.
export const TRADE_PRODUCTS: TradeProduct[] = [
  {id: 'oranges', name: 'Oranges', codes: ['080510'], codeLabel: '080510'},
  {id: 'mandarins', name: 'Mandarins / clementines', codes: ['080521', '080522', '080529'], codeLabel: '080521 + 080522 + 080529'},
  {id: 'lemons-limes', name: 'Lemons / limes', codes: ['080550'], codeLabel: '080550'},
  {id: 'grapefruit', name: 'Grapefruit', codes: ['080540'], codeLabel: '080540'},
  {id: 'apples', name: 'Apples', codes: ['080810'], codeLabel: '080810'},
  {id: 'pears', name: 'Pears', codes: ['080830'], codeLabel: '080830'},
  {id: 'table-grapes', name: 'Table grapes', codes: ['08061010'], codeLabel: '08061010'},
  {id: 'strawberries', name: 'Strawberries', codes: ['081010'], codeLabel: '081010'},
  {id: 'peaches-nectarines', name: 'Peaches / nectarines', codes: ['080930'], codeLabel: '080930'},
  {id: 'cherries', name: 'Cherries', codes: ['080921', '080929'], codeLabel: '080921 + 080929'},
  {id: 'kiwifruit', name: 'Kiwifruit', codes: ['081050'], codeLabel: '081050'},
  {id: 'melons', name: 'Melons (excluding watermelons)', codes: ['080719'], codeLabel: '080719'},
  {id: 'watermelons', name: 'Watermelons', codes: ['080711'], codeLabel: '080711'},
  {id: 'avocados', name: 'Avocados', codes: ['080440'], codeLabel: '080440'},
  {id: 'tomatoes', name: 'Tomatoes', codes: ['070200'], codeLabel: '070200'},
  {id: 'peppers', name: 'Peppers (Capsicum / Pimenta)', codes: ['070960'], codeLabel: '070960'},
  {id: 'cucumbers', name: 'Cucumbers', codes: ['07070005'], codeLabel: '07070005'},
  {id: 'courgettes', name: 'Courgettes', codes: ['07099310'], codeLabel: '07099310'},
  {id: 'lettuce', name: 'Lettuce', codes: ['070511', '070519'], codeLabel: '070511 + 070519'},
  {id: 'onions', name: 'Onions', codes: ['07031011', '07031019'], codeLabel: '07031011 + 07031019'},
  {id: 'garlic', name: 'Garlic', codes: ['070320'], codeLabel: '070320'},
  {id: 'potatoes', name: 'Potatoes (excluding seed)', codes: ['070190'], codeLabel: '070190'},
  {id: 'artichokes', name: 'Artichokes', codes: ['07099100'], codeLabel: '07099100'},
  {id: 'asparagus', name: 'Asparagus', codes: ['07092000'], codeLabel: '07092000'},
];

export function getTradeProduct(id: string) {
  return TRADE_PRODUCTS.find(product => product.id === id) ?? null;
}
