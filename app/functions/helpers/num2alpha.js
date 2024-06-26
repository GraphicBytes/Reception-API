//########################################################
//############### Number to Alpha Function ###############
//########################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function num2alpha(data) {
  const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  if (data <= 25) {
    return alphabet[data];
  } else if (data > 25) {
    let dividend = data + 1;
    let alpha = '';
    while (dividend > 0) {
      const modulo = (dividend - 1) % 26;
      alpha = alphabet[modulo] + alpha;
      dividend = Math.floor((dividend - modulo) / 26);
    }
    return alpha;
  }
} 
