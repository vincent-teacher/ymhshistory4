/**
 * 楊梅高中校史大事記 - 主應用核心邏輯
 * 整合資料庫檢索、多語言、原生音效、歷史照片燈箱與七大顯示控制
 */

(function () {
    'use strict';

    // 狀態管理物件
    const state = {
        lang: localStorage.getItem('ymh_lang') || 'zh-TW',
        theme: localStorage.getItem('ymh_theme') || 'system',
        fontSize: localStorage.getItem('ymh_font') || 'normal',
        device: localStorage.getItem('ymh_device') || 'auto',
        layout: localStorage.getItem('ymh_layout') || 'vertical',
        audio: localStorage.getItem('ymh_sound') !== 'false',
        blossom: localStorage.getItem('ymh_blossom') !== 'false',
        
        // 檢索與過濾狀態
        searchQuery: '',
        selectedEra: 'all',
        selectedCategory: 'all'
    };

    // DOM 元素引用
    const dom = {
        root: document.documentElement,
        body: document.body,
        viewportWrapper: document.getElementById('viewportWrapper'),
        timelineContainer: document.getElementById('timelineStream'),
        searchInput: document.getElementById('historySearchInput'),
        searchClearBtn: document.getElementById('searchClearBtn'),
        filterCount: document.getElementById('filterCountDisplay'),
        storiesGrid: document.getElementById('storiesGrid'),
        principalsGrid: document.getElementById('principalsGrid'),
        buildingsGrid: document.getElementById('buildingsGrid'),
        quickYearsNav: document.getElementById('quickYearsNav'),
        
        // Modal
        settingsModal: document.getElementById('settingsModal'),
        storyModal: document.getElementById('storyModal'),
        storyModalTitle: document.getElementById('storyModalTitle'),
        storyModalSubtitle: document.getElementById('storyModalSubtitle'),
        storyModalContent: document.getElementById('storyModalContent'),
        storyModalTags: document.getElementById('storyModalTags'),
        
        // Lightbox
        lightboxModal: document.getElementById('lightboxModal'),
        lightboxImg: document.getElementById('lightboxImg'),
        lightboxCaption: document.getElementById('lightboxCaption'),
        
        // 浮動按鈕
        scrollTopBtn: document.getElementById('scrollTopBtn'),
        openSettingsBtn: document.getElementById('openSettingsBtn'),
        toggleSoundBtn: document.getElementById('toggleSoundBtn'),
        navSettingsBtn: document.getElementById('navSettingsBtn')
    };

    /* ==========================================================================
       初始化設定與偏好載入
       ========================================================================== */
    function initSettings() {
        // 1. 色系
        applyTheme(state.theme);

        // 2. 字體
        applyFontSize(state.fontSize);

        // 3. 裝置模式
        applyDevice(state.device);

        // 4. 版面排版
        applyLayout(state.layout);

        // 5. 音效
        if (window.soundEngine) {
            window.soundEngine.setEnabled(state.audio);
        }
        updateSoundButtons();

        // 6. 梅花飄落特效
        if (window.blossomEngine) {
            if (state.blossom) {
                window.blossomEngine.start();
            } else {
                window.blossomEngine.stop();
            }
        }

        // 7. 多語言
        applyLanguage(state.lang);

        // 監聽全螢幕變化以同步全螢幕按鈕狀態
        document.addEventListener('fullscreenchange', updateFullscreenButtons);
    }

    /* ==========================================================================
       七大顯示與操作切換實作
       ========================================================================== */

    // (1) 全螢幕切換
    function toggleFullscreen(enable) {
        if (enable) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn('Fullscreen request failed:', err);
                });
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.warn('Exit fullscreen failed:', err);
                });
            }
        }
        if (window.soundEngine) window.soundEngine.playToggle(enable);
    }

    function updateFullscreenButtons() {
        const isFull = Boolean(document.fullscreenElement);
        document.querySelectorAll('[data-setting="fullscreen"]').forEach(btn => {
            const val = btn.getAttribute('data-value') === 'true';
            btn.classList.toggle('active', val === isFull);
        });
    }

    // (2) 音效切換
    function setAudioEnabled(val) {
        state.audio = Boolean(val);
        localStorage.setItem('ymh_sound', state.audio);
        if (window.soundEngine) {
            window.soundEngine.setEnabled(state.audio);
            window.soundEngine.playToggle(state.audio);
        }
        updateSoundButtons();
    }

    function updateSoundButtons() {
        document.querySelectorAll('[data-setting="audio"]').forEach(btn => {
            const val = btn.getAttribute('data-value') === 'true';
            btn.classList.toggle('active', val === state.audio);
        });
        if (dom.toggleSoundBtn) {
            dom.toggleSoundBtn.setAttribute('title', state.audio ? '音效已開啟 (點擊靜音)' : '音效已靜音 (點擊開啟)');
            dom.toggleSoundBtn.innerHTML = state.audio 
                ? '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
                : '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
        }
    }

    // (3) 裝置視圖模擬切換
    function applyDevice(dev) {
        state.device = dev;
        localStorage.setItem('ymh_device', dev);
        dom.body.classList.remove('device-auto', 'device-mobile', 'device-tablet', 'device-desktop');
        if (dev !== 'auto') {
            dom.body.classList.add(`device-${dev}`);
        }
        document.querySelectorAll('[data-setting="device"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === dev);
        });
        if (window.soundEngine) window.soundEngine.playClick();
    }

    // (4) 版面編排切換 (直式/橫式/自動)
    function applyLayout(layout) {
        state.layout = layout;
        localStorage.setItem('ymh_layout', layout);
        dom.body.classList.remove('layout-auto', 'layout-vertical', 'layout-horizontal');
        dom.body.classList.add(`layout-${layout}`);
        document.querySelectorAll('[data-setting="layout"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === layout);
        });
        if (window.soundEngine) window.soundEngine.playClick();
    }

    // (5) 語言切換 (繁體中文 / 英文)
    function applyLanguage(lang) {
        state.lang = lang;
        localStorage.setItem('ymh_lang', lang);
        const dict = window.I18N[lang] || window.I18N['zh-TW'];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                if (el.tagName === 'INPUT') {
                    el.placeholder = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        document.querySelectorAll('[data-setting="language"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === lang);
        });

        renderTimeline();
    }

    // (6) 字體大小切換
    function applyFontSize(size) {
        state.fontSize = size;
        localStorage.setItem('ymh_font', size);
        dom.root.setAttribute('data-font-size', size);
        document.querySelectorAll('[data-setting="font"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === size);
        });
        if (window.soundEngine) window.soundEngine.playClick();
    }

    // (7) 色系風格切換 (跟隨系統 / 亮色 / 暗色)
    function applyTheme(theme) {
        state.theme = theme;
        localStorage.setItem('ymh_theme', theme);
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            dom.root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            dom.root.setAttribute('data-theme', theme);
        }
        document.querySelectorAll('[data-setting="theme"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === theme);
        });
        if (window.soundEngine) window.soundEngine.playClick();
    }

    // 梅花飄落動態開關
    function toggleBlossom(val) {
        state.blossom = Boolean(val);
        localStorage.setItem('ymh_blossom', state.blossom);
        if (window.blossomEngine) {
            if (state.blossom) window.blossomEngine.start();
            else window.blossomEngine.stop();
        }
        document.querySelectorAll('[data-setting="blossom"]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === String(val));
        });
        if (window.soundEngine) window.soundEngine.playToggle(state.blossom);
    }

    /* ==========================================================================
       歷史事件過濾與高亮演算法
       ========================================================================== */
    function filterEvents() {
        if (!window.YMH_DATA || !window.YMH_DATA.events) return [];
        const q = state.searchQuery.trim().toLowerCase();

        return window.YMH_DATA.events.filter(item => {
            // 年代過濾
            if (state.selectedEra !== 'all' && item.era !== state.selectedEra) {
                return false;
            }
            // 類別過濾
            if (state.selectedCategory !== 'all' && item.category !== state.selectedCategory) {
                return false;
            }
            // 搜尋關鍵字
            if (q) {
                const matchTitle = item.title && item.title.toLowerCase().includes(q);
                const matchSummary = item.summary && item.summary.toLowerCase().includes(q);
                const matchDate = item.date && item.date.toLowerCase().includes(q);
                const matchYear = String(item.year).includes(q) || String(item.roc).includes(q);
                const matchDetails = item.details && item.details.some(d => d.toLowerCase().includes(q));
                const matchStory = item.story && (item.story.title.toLowerCase().includes(q) || item.story.content.toLowerCase().includes(q));
                if (!matchTitle && !matchSummary && !matchDate && !matchYear && !matchDetails && !matchStory) {
                    return false;
                }
            }
            return true;
        });
    }

    function highlightText(text, query) {
        if (!query || !text) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<span class="highlight-keyword">$1</span>');
    }

    /* ==========================================================================
       時間軸動態渲染
       ========================================================================== */
    function renderTimeline() {
        if (!dom.timelineContainer) return;
        const filtered = filterEvents();
        const dict = window.I18N[state.lang] || window.I18N['zh-TW'];

        // 更新筆數統計
        if (dom.filterCount) {
            dom.filterCount.textContent = `${dict.filterCountPrefix}${filtered.length}${dict.filterCountSuffix}`;
        }

        if (filtered.length === 0) {
            dom.timelineContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-light);">
                    <svg width="48" height="48" fill="none" stroke="var(--accent-red)" stroke-width="2" viewBox="0 0 24 24" style="margin-bottom: 12px;">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 8px;">${dict.emptyResults}</h3>
                    <button id="resetSearchBtnInside" class="filter-pill active" style="margin-top: 12px; cursor: pointer;">${dict.resetBtn}</button>
                </div>
            `;
            const rBtn = document.getElementById('resetSearchBtnInside');
            if (rBtn) {
                rBtn.addEventListener('click', () => {
                    resetSearch();
                });
            }
            return;
        }

        let html = '';
        let currentEra = '';

        filtered.forEach((item, index) => {
            // 當年代分期轉換時插入分期標籤
            if (item.era !== currentEra) {
                currentEra = item.era;
                html += `
                    <div class="timeline-era-divider">
                        <span class="era-divider-badge">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            ${currentEra}
                        </span>
                    </div>
                `;
            }

            const isLeft = index % 2 === 0;
            const sideClass = isLeft ? 'left' : 'right';
            const catClass = `cat-${item.category}`;

            // 類別多語言對照標籤
            let catName = '學校紀事';
            if (item.category === 'institution') catName = dict.filterCatInstitution;
            else if (item.category === 'principal') catName = dict.filterCatPrincipal;
            else if (item.category === 'campus') catName = dict.filterCatCampus;
            else if (item.category === 'academic') catName = dict.filterCatAcademic;
            else if (item.category === 'achievement') catName = dict.filterCatAchievement;

            const q = state.searchQuery.trim();
            const hTitle = highlightText(item.title, q);
            const hSummary = highlightText(item.summary, q);

            let photoHtml = '';
            if (item.image) {
                photoHtml = `
                    <div class="card-photo-box" onclick="window.showLightbox('${item.image}', '${item.imageCaption || item.title}')">
                        <img class="card-photo-img" src="${item.image}" alt="${item.title}" loading="lazy">
                        <div class="card-photo-caption">
                            <span>📷 ${item.imageCaption || item.title}</span>
                            <span style="font-size: 0.75rem; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px;">${dict.clickToEnlarge}</span>
                        </div>
                    </div>
                `;
            }

            let detailsHtml = '';
            if (item.details && item.details.length > 0) {
                detailsHtml = `
                    <ul class="card-details-list">
                        ${item.details.map(d => `<li>${highlightText(d, q)}</li>`).join('')}
                    </ul>
                `;
            }

            let storyBtnHtml = '';
            if (item.story) {
                storyBtnHtml = `
                    <button class="story-callout-btn" onclick="window.showStoryModal('${item.id}')">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                        <span>${dict.readStory}：${item.story.title}</span>
                    </button>
                `;
            }

            html += `
                <div class="timeline-card-wrapper ${sideClass}" id="event-${item.year}">
                    <div class="timeline-node-pin"></div>
                    <article class="timeline-card">
                        <div class="card-header-meta">
                            <div class="card-year-badge">
                                <span>${item.year}</span>
                                <span class="card-roc-tag">${item.date}</span>
                            </div>
                            <span class="card-cat-badge ${catClass}">${catName}</span>
                        </div>
                        <h3 class="card-title">${hTitle}</h3>
                        <p class="card-summary">${hSummary}</p>
                        ${photoHtml}
                        ${detailsHtml}
                        ${storyBtnHtml}
                    </article>
                </div>
            `;
        });

        dom.timelineContainer.innerHTML = html;
    }

    /* ==========================================================================
       專題內容渲染（梅岡拾穗故事、歷任校長、名樓建築）
       ========================================================================== */
    function renderStaticSections() {
        if (!window.YMH_DATA) return;

        // 1. 梅岡拾穗故事
        if (dom.storiesGrid && window.YMH_DATA.stories) {
            dom.storiesGrid.innerHTML = window.YMH_DATA.stories.map(s => `
                <div class="feature-box" style="cursor: pointer;" onclick="window.showStoryModal('${s.id}')">
                    <div class="feature-box-title">
                        <svg width="20" height="20" fill="var(--accent-red)" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                        <span>${s.title}</span>
                    </div>
                    <div class="feature-box-subtitle">${s.subtitle}</div>
                    <p class="feature-box-text">${s.content.substring(0, 110)}...</p>
                    <div style="margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
                        ${s.tags.map(t => `<span style="font-size: 0.75rem; padding: 2px 8px; background: var(--primary-soft); color: var(--primary-dark); border-radius: 4px; font-weight: 600;">#${t}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }

        // 2. 歷任校長
        if (dom.principalsGrid && window.YMH_DATA.principals) {
            dom.principalsGrid.innerHTML = window.YMH_DATA.principals.map(p => `
                <div class="feature-box">
                    <div class="feature-box-title">
                        <svg width="18" height="18" fill="var(--primary)" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        <span>${p.name}</span>
                    </div>
                    <div class="feature-box-subtitle">${p.term} ‧ ${p.years}</div>
                    <p class="feature-box-text">${p.desc}</p>
                </div>
            `).join('');
        }

        // 3. 名樓勝景
        if (dom.buildingsGrid && window.YMH_DATA.buildings) {
            dom.buildingsGrid.innerHTML = window.YMH_DATA.buildings.map(b => `
                <div class="feature-box">
                    <div class="feature-box-title">
                        <svg width="18" height="18" fill="var(--accent-gold)" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
                        <span>${b.name}</span>
                    </div>
                    <div class="feature-box-subtitle">${b.alias}</div>
                    <p class="feature-box-text"><strong>【人文意涵】</strong>${b.concept}</p>
                    <p class="feature-box-text" style="margin-top: 6px;"><strong>【特色配置】</strong>${b.features}</p>
                </div>
            `).join('');
        }

        // 4. 年份快速導覽直達條
        if (dom.quickYearsNav && window.YMH_DATA.events) {
            const milestoneYears = [1948, 1951, 1968, 1969, 1970, 1971, 1974, 1977, 1983, 1986, 1993, 1994, 2000, 2006, 2010, 2012, 2014, 2016, 2017, 2018];
            dom.quickYearsNav.innerHTML = milestoneYears.map(yr => `
                <button class="quick-year-btn" onclick="window.scrollToYear(${yr})">${yr}</button>
            `).join('');
        }

        // 5. 珍貴歷史照片藝廊 (Photo Gallery)
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid && window.YMH_DATA.gallery) {
            galleryGrid.innerHTML = window.YMH_DATA.gallery.map(g => `
                <div class="gallery-photo-card" onclick="window.showLightbox('${g.img}', '${g.title} - ${g.desc}')">
                    <div class="gallery-photo-thumb-box">
                        <img src="${g.img}" alt="${g.title}" class="gallery-photo-thumb" loading="lazy">
                        <span class="gallery-zoom-badge">🔍 點擊放大</span>
                    </div>
                    <div class="gallery-photo-info">
                        <h4 class="gallery-photo-title">${g.title}</h4>
                        <p class="gallery-photo-desc">${g.desc}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    /* ==========================================================================
       彈窗與 Lightbox 控制
       ========================================================================== */
    window.showLightbox = function (imgUrl, caption) {
        if (!dom.lightboxModal) return;
        dom.lightboxImg.src = imgUrl;
        dom.lightboxCaption.textContent = caption || '';
        dom.lightboxModal.classList.add('active');
        if (window.soundEngine) window.soundEngine.playExpand();
    };

    window.closeLightbox = function () {
        if (!dom.lightboxModal) return;
        dom.lightboxModal.classList.remove('active');
        dom.lightboxImg.src = '';
        if (window.soundEngine) window.soundEngine.playClick();
    };

    window.showStoryModal = function (storyIdOrEventId) {
        if (!dom.storyModal) return;
        let storyData = null;

        // 搜尋事件中的故事或獨立故事
        if (window.YMH_DATA.stories) {
            storyData = window.YMH_DATA.stories.find(s => s.id === storyIdOrEventId);
        }
        if (!storyData && window.YMH_DATA.events) {
            const ev = window.YMH_DATA.events.find(e => e.id === storyIdOrEventId);
            if (ev && ev.story) {
                storyData = {
                    title: ev.story.title,
                    subtitle: `${ev.date} 歷史記憶迴響`,
                    content: ev.story.content,
                    tags: ['校史記憶', '珍貴隨筆']
                };
            }
        }

        if (storyData) {
            dom.storyModalTitle.textContent = storyData.title;
            dom.storyModalSubtitle.textContent = storyData.subtitle || '';
            dom.storyModalContent.innerHTML = storyData.content.replace(/\n/g, '<br><br>');
            dom.storyModalTags.innerHTML = (storyData.tags || []).map(t => `<span style="font-size: 0.8rem; padding: 3px 10px; background: var(--primary-soft); color: var(--primary-dark); border-radius: 4px; font-weight: 700;">#${t}</span>`).join('');
            dom.storyModal.classList.add('active');
            if (window.soundEngine) window.soundEngine.playExpand();
        }
    };

    window.closeStoryModal = function () {
        if (!dom.storyModal) return;
        dom.storyModal.classList.remove('active');
        if (window.soundEngine) window.soundEngine.playClick();
    };

    window.openSettings = function () {
        if (!dom.settingsModal) return;
        dom.settingsModal.classList.add('active');
        updateFullscreenButtons();
        if (window.soundEngine) window.soundEngine.playClick();
    };

    window.closeSettings = function () {
        if (!dom.settingsModal) return;
        dom.settingsModal.classList.remove('active');
        if (window.soundEngine) window.soundEngine.playClick();
    };

    window.scrollToYear = function (year) {
        const el = document.getElementById(`event-${year}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (window.soundEngine) window.soundEngine.playClick();
        }
    };

    function resetSearch() {
        state.searchQuery = '';
        state.selectedEra = 'all';
        state.selectedCategory = 'all';

        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.searchClearBtn) dom.searchClearBtn.classList.remove('visible');

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
            if (pill.getAttribute('data-filter-val') === 'all') {
                pill.classList.add('active');
            }
        });

        renderTimeline();
        if (window.soundEngine) window.soundEngine.playSearch();
    }

    /* ==========================================================================
       事件監聽與互動綁定
       ========================================================================== */
    function bindEvents() {
        // 搜尋輸入監聽
        if (dom.searchInput) {
            dom.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                if (dom.searchClearBtn) {
                    dom.searchClearBtn.classList.toggle('visible', Boolean(state.searchQuery));
                }
                renderTimeline();
                if (window.soundEngine && state.searchQuery.length > 1) {
                    window.soundEngine.playSearch();
                }
            });
        }

        // 清除搜尋按鈕
        if (dom.searchClearBtn) {
            dom.searchClearBtn.addEventListener('click', () => {
                dom.searchInput.value = '';
                state.searchQuery = '';
                dom.searchClearBtn.classList.remove('visible');
                renderTimeline();
                if (window.soundEngine) window.soundEngine.playClick();
            });
        }

        // 年代篩選標籤
        document.querySelectorAll('[data-filter-type="era"]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('[data-filter-type="era"]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.selectedEra = pill.getAttribute('data-filter-val');
                renderTimeline();
                if (window.soundEngine) window.soundEngine.playTab();
            });
        });

        // 類別篩選標籤
        document.querySelectorAll('[data-filter-type="category"]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('[data-filter-type="category"]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.selectedCategory = pill.getAttribute('data-filter-val');
                renderTimeline();
                if (window.soundEngine) window.soundEngine.playTab();
            });
        });

        // 重設條件按鈕
        const resetFilterBtn = document.getElementById('resetFiltersBtn');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', resetSearch);
        }

        // 設定控制項按鈕綁定 (七大切換)
        document.querySelectorAll('[data-setting]').forEach(btn => {
            btn.addEventListener('click', () => {
                const settingKey = btn.getAttribute('data-setting');
                const settingVal = btn.getAttribute('data-value');

                switch (settingKey) {
                    case 'fullscreen':
                        toggleFullscreen(settingVal === 'true');
                        break;
                    case 'audio':
                        setAudioEnabled(settingVal === 'true');
                        break;
                    case 'device':
                        applyDevice(settingVal);
                        break;
                    case 'layout':
                        applyLayout(settingVal);
                        break;
                    case 'language':
                        applyLanguage(settingVal);
                        break;
                    case 'font':
                        applyFontSize(settingVal);
                        break;
                    case 'theme':
                        applyTheme(settingVal);
                        break;
                    case 'blossom':
                        toggleBlossom(settingVal === 'true');
                        break;
                }
            });
        });

        // 設定視窗開關
        if (dom.openSettingsBtn) dom.openSettingsBtn.addEventListener('click', window.openSettings);
        if (dom.navSettingsBtn) dom.navSettingsBtn.addEventListener('click', window.openSettings);

        // 浮動音效按鈕
        if (dom.toggleSoundBtn) {
            dom.toggleSoundBtn.addEventListener('click', () => {
                setAudioEnabled(!state.audio);
            });
        }

        // 滾動至頂端
        if (dom.scrollTopBtn) {
            dom.scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (window.soundEngine) window.soundEngine.playClick();
            });

            window.addEventListener('scroll', () => {
                dom.scrollTopBtn.style.opacity = window.scrollY > 300 ? '1' : '0';
                dom.scrollTopBtn.style.pointerEvents = window.scrollY > 300 ? 'auto' : 'none';
            });
        }

        // 點擊彈窗遮罩關閉
        [dom.settingsModal, dom.storyModal, dom.lightboxModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                        if (window.soundEngine) window.soundEngine.playClick();
                    }
                });
            }
        });

        // ESC 鍵關閉所有彈窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (dom.lightboxModal && dom.lightboxModal.classList.contains('active')) window.closeLightbox();
                if (dom.storyModal && dom.storyModal.classList.contains('active')) window.closeStoryModal();
                if (dom.settingsModal && dom.settingsModal.classList.contains('active')) window.closeSettings();
            }
        });
    }

    // 啟動入口
    document.addEventListener('DOMContentLoaded', () => {
        initSettings();
        renderStaticSections();
        renderTimeline();
        bindEvents();
    });

})();
