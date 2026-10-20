/*
  Guias de tamanhos (aparecem na página do produto, em "Guia de tamanhos").
  As medidas são do corpo, em centímetros. Ajusta à tua marca/fornecedor.
*/
export const GUIAS = {
  roupa: {
    title: 'Guia de tamanhos — roupa',
    intro: 'Medidas do corpo, em centímetros. Se estiveres entre dois tamanhos, escolhe o maior para um corte mais solto.',
    columns: ['Tamanho', 'Peito', 'Cintura', 'Anca', 'PT/EU'],
    rows: [
      ['XS', '78–82', '60–64', '86–90', '34'],
      ['S', '82–86', '64–68', '90–94', '36'],
      ['M', '86–90', '68–72', '94–98', '38'],
      ['L', '90–96', '72–78', '98–104', '40'],
      ['XL', '96–102', '78–84', '104–110', '42'],
      ['XXL', '102–108', '84–90', '110–116', '44'],
    ],
    howTo: [
      ['Peito', 'À volta da parte mais cheia do peito, com a fita na horizontal.'],
      ['Cintura', 'À volta da parte mais estreita da cintura, sem apertar.'],
      ['Anca', 'À volta da parte mais larga da anca, com os pés juntos.'],
    ],
  },
  calcado: {
    title: 'Guia de tamanhos — calçado',
    intro: 'Mede o pé do calcanhar à ponta do dedo maior, ao fim do dia (o pé fica um pouco maior).',
    columns: ['Tamanho EU', 'Comprimento do pé (cm)', 'UK', 'US'],
    rows: [
      ['35', '22,5', '2,5', '5'],
      ['36', '23', '3,5', '6'],
      ['37', '23,5', '4', '6,5'],
      ['38', '24', '5', '7,5'],
      ['39', '25', '6', '8,5'],
      ['40', '25,5', '6,5', '9'],
      ['41', '26', '7,5', '10'],
      ['42', '27', '8', '10,5'],
      ['43', '27,5', '9', '11,5'],
      ['44', '28,5', '9,5', '12'],
      ['45', '29', '10,5', '13'],
    ],
    howTo: [
      ['Como medir', 'Põe o pé numa folha de papel encostado à parede, marca a ponta do dedo maior e mede com uma régua.'],
      ['Entre dois tamanhos', 'Escolhe o maior, sobretudo em sapatos fechados ou de salto.'],
    ],
  },
};

// Que guia mostrar num produto (auto: sapatos → calçado; produtos com tamanhos → roupa)
export const guideFor = (product) => {
  if (!product?.sizes?.length || product.sizeGuide === 'nenhum') return null;
  if (product.sizeGuide === 'roupa' || product.sizeGuide === 'calcado') return GUIAS[product.sizeGuide];
  return product.category === 'sapatos' ? GUIAS.calcado : ['roupas', 'desporto', 'praia'].includes(product.category) ? GUIAS.roupa : null;
};
