import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/fetchApi';
import styles from './SearchBar.module.css';

interface SearchResult {
  name: string;
  type: 'user' | 'sub';
  thumbnailUrl?: string;
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchApi('searchActors', {}, { query: query.trim() });
        if (res.success) {
          setResults(res.actors.map(actor => ({
            name: actor.name,
            type: actor.type,
            thumbnailUrl: actor.thumbnailUrl
          })));
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'sub') {
      navigate(`/subreddit/${encodeURIComponent(result.name)}`);
    } else {
      navigate(`/user/${encodeURIComponent(result.name)}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <input
        type="text"
        maxLength={100}
        placeholder="Search users and subs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.searchInput}
      />
      {isOpen && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.loadingItem}>Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.name}
                className={styles.resultItem}
                onClick={() => handleResultClick(result)}
              >
                {result.thumbnailUrl && (
                  <img src={result.thumbnailUrl} alt="" className={styles.thumbnail} />
                )}
                <span className={styles.resultName}>
                  {result.type === 'sub' ? 'r/' : 'u/'}{result.name}
                </span>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;