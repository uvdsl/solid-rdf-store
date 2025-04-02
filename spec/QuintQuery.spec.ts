import { Quint } from "../src/Quint";
import { QuintQuery } from "../src/QuintQuery";

describe('QuintQuery', () => {
  // Sample Quint objects for testing
  const quint1 = new Quint('subject1', 'predicate1', 'object1', 'graph1', 'dataset1');
  const quint2 = new Quint('subject2', 'predicate2', 'object2', 'graph2', 'dataset2');
  
  describe('constructor', () => {
    test('should initialize with all parameters set', () => {
      const query = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', [quint1]);
      
      expect(query.subject).toBe('subject');
      expect(query.predicate).toBe('predicate');
      expect(query.object).toBe('object');
      expect(query.graph).toBe('graph');
      expect(query.dataset).toBe('dataset');
      expect(query.result).toEqual([quint1]);
    });
    
    test('should initialize with null parameters', () => {
      const query = new QuintQuery(null, null, null, null, null, []);
      expect(query.subject).toBeNull();
      expect(query.predicate).toBeNull();
      expect(query.object).toBeNull();
      expect(query.graph).toBeNull();
      expect(query.dataset).toBeNull();
      expect(query.result).toEqual([]);
    });
    
    test('should initialize with mixed null and non-null parameters', () => {
      const query = new QuintQuery('subject', null, 'object', null, 'dataset', []);
      expect(query.subject).toBe('subject');
      expect(query.predicate).toBeNull();
      expect(query.object).toBe('object');
      expect(query.graph).toBeNull();
      expect(query.dataset).toBe('dataset');
      expect(query.result).toEqual([]);
    });
    
    test('should initialize with multiple results', () => {
      const query = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', [quint1, quint2]);
      expect(query.result).toHaveLength(2);
      expect(query.result).toContain(quint1);
      expect(query.result).toContain(quint2);
    });
  });
  
  describe('equals method', () => {
    test('should return true for identical queries', () => {
      const query1 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', []);
      const query2 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', []);
      expect(query1.equals(query2)).toBe(true);
    });
    
    test('should return true for identical queries with different results', () => {
      const query1 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', [quint1]);
      const query2 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', [quint2]);
      expect(query1.equals(query2)).toBe(true);
    });
    
    test('should return false when subject differs', () => {
      const query1 = new QuintQuery('subject1', 'predicate', 'object', 'graph', 'dataset', []);
      const query2 = new QuintQuery('subject2', 'predicate', 'object', 'graph', 'dataset', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should return false when predicate differs', () => {
      const query1 = new QuintQuery('subject', 'predicate1', 'object', 'graph', 'dataset', []);
      const query2 = new QuintQuery('subject', 'predicate2', 'object', 'graph', 'dataset', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should return false when object differs', () => {
      const query1 = new QuintQuery('subject', 'predicate', 'object1', 'graph', 'dataset', []);
      const query2 = new QuintQuery('subject', 'predicate', 'object2', 'graph', 'dataset', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should return false when graph differs', () => {
      const query1 = new QuintQuery('subject', 'predicate', 'object', 'graph1', 'dataset', []);
      const query2 = new QuintQuery('subject', 'predicate', 'object', 'graph2', 'dataset', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should return false when dataset differs', () => {
      const query1 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset1', []);
      const query2 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset2', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should handle null values correctly', () => {
      const query1 = new QuintQuery(null, 'predicate', null, 'graph', null, []);
      const query2 = new QuintQuery(null, 'predicate', null, 'graph', null, []);
      expect(query1.equals(query2)).toBe(true);
    });
    
    test('should return false when comparing null to non-null values', () => {
      const query1 = new QuintQuery(null, 'predicate', 'object', 'graph', 'dataset', []);
      const query2 = new QuintQuery('subject', 'predicate', 'object', 'graph', 'dataset', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should handle complex mix of null and non-null values', () => {
      const query1 = new QuintQuery('subject', null, 'object', null, 'dataset', []);
      const query2 = new QuintQuery('subject', null, 'object', null, 'dataset', [quint1, quint2]);
      expect(query1.equals(query2)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should differentiate between empty strings and null', () => {
      const query1 = new QuintQuery('', null, '', null, '', []);
      const query2 = new QuintQuery('', '', '', '', '', []);
      expect(query1.equals(query2)).toBe(false);
    });
    
    test('should work with special characters in strings', () => {
      const query1 = new QuintQuery('subject\n', 'predicate\t', 'object"', 'graph\'', 'dataset\\', []);
      const query2 = new QuintQuery('subject\n', 'predicate\t', 'object"', 'graph\'', 'dataset\\', []);
      expect(query1.equals(query2)).toBe(true);
    });
  });
});