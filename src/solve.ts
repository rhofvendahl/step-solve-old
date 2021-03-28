// import { exception } from "console";

const formatTokens = (tokens: Token[]): string => {
  let formatted = tokens.map((token) => token.value.toString()).join(' ')
  formatted = formatted.split('neg (').join('- (')
  return formatted
}

type TokenType = 'operator' | 'integer' | 'float';
// TODO: Figure out how to use TokenValue alias without causing problems.
  // Problem: 'Type "string" is not assignable to type "TokenValue"'
// type TokenValue = '(' | ')' | '^' | 'neg' | '*' | '/' | '+' | '-' | number;
type TokenValue = string | number;
type Token = {
  type: TokenType,
  value: TokenValue
};

const tokenizeLiteral = (literal: string): Token | undefined => {
  // console.log('tokenize literal: ', literal);
  if (literal.includes('.')) {
    if (isNaN(parseFloat(literal))) {
      // raise Exception('User Error: Solitary "." is not a valid literal.')
      return undefined
    } else {
      return {type: 'float', value: parseFloat(literal)};
    }
  } else if (!isNaN(parseInt(literal))) {
    return {type: 'integer', value: parseInt(literal)};
  } else {
    // raise Exception('User Error: Literal not recognized.')
    return undefined
  }
};

const tokenize = (text: string): Token[] | undefined => {
  let tokens: Token[] = [];
  for (let i=0; i < text.length; i++) {
    // Char at i is a number or "."
    if (!isNaN(parseInt(text.charAt(i))) || text.charAt(i) === '.') {
      // console.log('tokenize: char at i is a number or "."', text.charAt(i));
      let j = i;
      // console.log(isNaN(parseInt(text.charAt(0))));
      while (j < text.length && (!isNaN(parseInt(text.charAt(j))) || text.charAt(j) === '.')) {
        // console.log('tokenize: inside while', text, text.charAt(j));
        j += 1;
      }
      const literal = text.slice(i, j);
      // console.log('tokenize: i j', i, j);
      const token = tokenizeLiteral(literal);
      if (token) {
        tokens.push(token);
        i = j-1;
        // console.log('tokenize: i = j', i);
      } else {
        // console.log('tokenize: tokenize literal returned undefined');
        // Internal Error: tokenize literal returned undefined.
        return undefined;
      }
    } else if (['(', ')', '^', '*', '/', '+', '-'].includes(text.charAt(i))) {
      // console.log('tokenize: operators includes char')
      const token: Token = {type: 'operator', value: text.charAt(i)}
      tokens.push(token);
    } else if (text.charAt(i) !== ' ') {
      // raise Exception('User Error: "' + text[i] + '" is not a valid character.')
      return undefined;
    }
  }
  // console.log('tokenize: returning', tokens);
  return tokens;
};

// NOT intended to handle errors.
const establishNegatives = (tokens: Token[]): Token[] => {
  let newTokens: Token[] = [];
  for (let i=0; i < tokens.length; i++) {
    // Is a candidate for conversion to "neg".
    if (tokens[i].value === '-') {
      let isNegative = true;
      // Minus is at the end.
      if (i+1 === tokens.length) {
        isNegative = false;
      // Minus is followed by an operator other than "(".
      } else if (tokens[i+1].type === 'operator' && tokens[i+1].value !== '(') {
        isNegative = false;
      // Minus follows a number.
      } else if (i > 0 && ['integer', 'float'].includes(tokens[i-1].type)) {
        isNegative = false;
      // Minus is followed by a number followed by an exponent sign (which operates before negative conversion).
      } else if (i+2 < tokens.length && tokens[i+2].value === '^') {
        isNegative = false
      }

      if (isNegative) {
        newTokens.push({type: 'operator', value: 'neg'})
      } else {
        newTokens.push({type: 'operator', value: '-'})
      }
    // Not a candidate for conversion for "neg".
    } else {
      newTokens.push({type: tokens[i].type, value: tokens[i].value})
    }
  }
  return newTokens;
};

// Only handles errors related to bad "neg"s.
const resolveNegatives = (tokens: Token[]): Token[] | undefined => {
  let newTokens: Token[] = [];
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].value === 'neg') {
      // Is at the end of expression (internal because it shouldn't have been converted if at end).
      if (i+1 >= tokens.length) {
        // raise Exception('Internal Error: Expression cannot end with a "neg".')
        return undefined
      // Is followed by "(".
      } else if (tokens[i+1].value === '(') {
        newTokens.push({type: 'operator', value: 'neg'});
      // Is followed by a number.
      } else if (['integer', 'float'].includes(tokens[i+1].type)) {
        // Doing this to narrow tokens[i+1].value type.
        const nextToken = tokens[i+1];
        if (typeof nextToken.value === 'number') {
          newTokens.push({type: nextToken.type, value: -1*nextToken.value});
        } // Else something has gone terribly wrong...
        i += 1;
      // Is followed by something other than "(" or a number (internal because shouldn't have been converted if so).
      } else {
        // raise Exception('Internal Error: "Neg"s must be followed by "(" or a number.')
        return undefined
      }
    } else {
      newTokens.push({type: tokens[i].type, value: tokens[i].value});
    }
  }
  return newTokens;
};

// Assumes no "neg"s or parentheses.
const performSimpleOperation = (tokens: Token[]): Token[] | undefined => {
  // console.log('perform simple operation: tokens at start', formatTokens(tokens));
  if (tokens.length === 1) {
    if (tokens[0].type === 'operator') {
      // User Error: Expression cannot consist of an operator. (or something)
      return undefined
    } else {
      return [{type: tokens[0].type, value: tokens[0].value}]; 
    }
  }

  const tokenValues: TokenValue[] = tokens.map((token) => token.value);
  const operators = ['^', '*', '/', '+', '-'];
  let operatorIndex = -1;
  for (let i=0; i<operators.length; i++) {
    if (tokenValues.includes(operators[i])) {
      operatorIndex = tokenValues.indexOf(operators[i]);
      break;
    };
  };

  if (operatorIndex === -1) {
    // raise Exception('User Error: Multiple tokens in expression with no operator.')
    return undefined;
  } else if (operatorIndex === 0) {
    // raise Exception('User Error: Expression cannot start with operator.')
    return undefined;
  } else if (operatorIndex === tokens.length-1) {
    // raise Exception('User Error: Expression cannot end with an operator.')
    return undefined;
  }
  
  let newToken: Token | undefined = undefined;

  const leftOperand: Token = tokens[operatorIndex-1];
  const rightOperand: Token = tokens[operatorIndex+1];
  const operator: Token = tokens[operatorIndex];
  console.log('perform simple operation: tokens, operator', formatTokens(tokens), operator);
  if (typeof leftOperand.value === 'number' && typeof rightOperand.value === 'number') {
    let newType: TokenType = 'integer';
    if (leftOperand.type === 'float' || rightOperand.type === 'float') {
      newType = 'float';
    }
    let newValue: number | undefined = undefined;
    if (operator.value === '^') {
      newValue = Math.pow(leftOperand.value, rightOperand.value);
    } else if (operator.value === '*') {
      newValue = leftOperand.value*rightOperand.value;
    } else if (operator.value === '/') {
      newValue = leftOperand.value/rightOperand.value;
    } else if (operator.value === '+') {
      newValue = leftOperand.value+rightOperand.value;
    } else if (operator.value === '-') {
      newValue = leftOperand.value-rightOperand.value;
    }
    if (newValue === undefined) {
      // raise exception('Internal Error: "' + operator['value'] + '" operator not recognized.')
      return undefined;
    } else {
      newToken = {type: newType, value: newValue};
    }
  } else {
    // raise Exception('User Error: "' + tokens[i]['value'] + '" operator requires numeric operands.')
    return undefined;
  }
  
  if (newToken === undefined) {
    // Internal Error: simple operation failed.
    return undefined;
  } else {
    const leftTokens = tokens.slice(0, operatorIndex-1).map((token) => ({type: token.type, value: token.value}));
    const rightTokens = tokens.slice(operatorIndex+2).map((token) => ({type: token.type, value: token.value}));
    const newTokens = leftTokens.concat([newToken]).concat(rightTokens);      
    // console.log('perform simple operation: info at end', operatorIndex);
    // console.log('perform simple operation: right', formatTokens(rightTokens));
    // console.log('perform simple operation: tokens at end', formatTokens(newTokens));
    return newTokens;
  }
};

const performOperation = (tokens: Token[]): Token[] | undefined => {
  // let newTokens: Token[] = [];
  // return newTokens;
  let parenStart: number | undefined = undefined;
  let parenEnd: number | undefined = undefined;
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].value === '(') {
      parenStart = i;
    } else if (tokens[i].value === ')') {
      parenEnd = i;
      break;
    }
  }

  if ((parenStart === undefined) !== (parenEnd === undefined)) {
    // User Error: Mismatched parentheses. (or something)
    return undefined;
  }

  let newTokens: Token[] | undefined = undefined;

  // We'll be working within parentheses.
  if (parenStart !== undefined && parenEnd !== undefined) {
    const contents: Token[] = tokens.slice(parenStart+1, parenEnd);
    if (contents.length === 0) {
      // raise Exception('User Error: Parentheses cannot be empty.')
      return undefined;
    }
    const contentsOperated: Token[] | undefined = performSimpleOperation(contents);
    if (contentsOperated === undefined) {
      // Internal Error: simple operation failed (or something).
      return undefined;
    }
    // Contents operated contains single number.
    if (contentsOperated.length === 1 && ['integer', 'float'].includes(contentsOperated[0].type)) {
      const leftTokens = tokens.slice(0, parenStart).map((token) => ({type: token.type, value: token.value}));
      const rightTokens = tokens.slice(parenEnd+1).map((token) => ({type: token.type, value: token.value}));
      newTokens = leftTokens.concat(contentsOperated).concat(rightTokens);
    } else {
      const leftTokens = tokens.slice(0, parenStart+1).map((token) => ({type: token.type, value: token.value}));
      const rightTokens = tokens.slice(parenEnd).map((token) => ({type: token.type, value: token.value}));
      newTokens = leftTokens.concat(contentsOperated).concat(rightTokens);
    }
  // There are no parentheses remaining.
  } else {
    newTokens = performSimpleOperation(tokens);
  }

  if (newTokens !== undefined) {
    newTokens = resolveNegatives(newTokens);
  }
  return newTokens;
};

const evaluate = (text: string): Token[][] | undefined => {
  let tokens = tokenize(text);
  if (tokens === undefined) {
    // Internal Error: Tokenize returned undefined (or something).
    return undefined
  }
  tokens = establishNegatives(tokens);
  if (tokens === undefined) {
    // Internal Error: Establish negatives returned undefined (or something).
    return undefined
  }
  tokens = resolveNegatives(tokens);
  if (tokens === undefined) {
    // Internal Error: Resolve negatives returned undefined (or something).
    return undefined
  }
  // console.log('evaluate: about to add first tokens to steps', tokens);
  let steps = [tokens];
  // const thing = history.length-1;
  // const thang = history[thing];
  while (steps[steps.length-1].length > 1) {
    tokens = steps[steps.length-1];
    tokens = performOperation(tokens);
    if (tokens === undefined) {
      // Internal Error: Perform operation returned undefined (or something).
      return undefined;
    }
    // console.log('evaluate: about to add tokens to steps within while', tokens);
    steps.push(tokens);
  }
  return steps;
};

export {
  tokenizeLiteral,
  tokenize,
  establishNegatives,
  resolveNegatives,
  performSimpleOperation,
  performOperation,
  evaluate,
  formatTokens
};

// TODO
  // Consider refactoring tokens; it's a little redundant to have to keep checking the actual type of the number, as well as the token.type.
  // Returns and conditionals and exceptions all over the place are leaving things a mess (especially performSimpleOperation).
    // In theory having early returns makes it so there are guarantees down the line, but that gets messy fast.....
  // Also idk about using "-1" as index default in that one place.
  // Ya, checks and exceptions are all over the place. resolve that.
  // ASAP make it so all these funcs can't return undefined... I'd love to remove all the narrowing for that.