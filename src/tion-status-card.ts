/* eslint-disable @typescript-eslint/no-explicit-any */
import {css, CSSResultGroup, html, LitElement, nothing, PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators";
import {HomeAssistant, LovelaceCardConfig} from "custom-card-helpers";
import {Themes} from "custom-card-helpers/src/types";

export interface CustomCardConfig extends LovelaceCardConfig {
    type: string;
    area?: string;
    module_device?: string;
    entity_co2?: string;
    entity_temperature?: string;
    entity_humidity?: string;
    breezer_device?: string;
    entity_climate?: string;
    entity_fan_speed?: string;
    entity_t_in?: string;
    entity_t_out?: string;
}

type entityCategory = "config" | "diagnostic";
export interface EntityRegistryDisplayEntry {
    entity_id: string;
    name?: string;
    icon?: string;
    device_id?: string;
    area_id?: string;
    hidden?: boolean;
    entity_category?: entityCategory;
    translation_key?: string;
    platform?: string;
    display_precision?: number;
}
export interface DeviceRegistryEntry {
    id: string;
    config_entries: string[];
    connections: Array<[string, string]>;
    identifiers: Array<[string, string]>;
    manufacturer: string | null;
    model: string | null;
    name: string | null;
    sw_version: string | null;
    hw_version: string | null;
    serial_number: string | null;
    via_device_id: string | null;
    area_id: string | null;
    name_by_user: string | null;
    entry_type: "service" | null;
    disabled_by: "user" | "integration" | "config_entry" | null;
    configuration_url: string | null;
}
export interface AreaRegistryEntry {
    area_id: string;
    name: string;
    picture: string | null;
    icon: string | null;
    aliases: string[];
}

export interface ThemesExt extends Themes {
    darkMode: boolean;
}

interface HomeAssistantExt extends HomeAssistant {
    themes: ThemesExt;
    entities: { [id: string]: EntityRegistryDisplayEntry };
    devices: { [id: string]: DeviceRegistryEntry };
    areas: { [id: string]: AreaRegistryEntry };
}

@customElement("tion-status-card")
class TionStatusCard extends LitElement {

    @property({attribute: false}) private _hass?: HomeAssistantExt;
    @state() private config?: CustomCardConfig;

    static getConfigElement() {
        return document.createElement("tion-status-card-editor");
    }

    static get properties() {
        return {
            hass: {},
            config: {},
        };
    }

    set hass(hass: HomeAssistantExt) {
        this._hass = hass;
    }

    static getStubConfig() {
        return {}
    }

    setConfig(config) {
        this.config = config;
    }

    getCardSize() {
        return 10;
    }

    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (!this.config) {
            return false;
        }

        return this._hasConfigOrEntitiesChanged([
            this.config.entity_climate || '',
            this.config.entity_co2 || '',
            this.config.entity_temperature || '',
            this.config.entity_humidity || '',
            this.config.entity_fan_speed || '',
            this.config.entity_temperature || '',
            this.config.entity_t_in || '',
            this.config.entity_t_out || '',
        ], changedProps, false);
    }

    private _hasConfigOrEntitiesChanged(
        entities: string[],
        changedProps: PropertyValues,
        forceUpdate: boolean,
    ): boolean {
        if (changedProps.has('config') || forceUpdate) {
            return true;
        }
        const oldHass = changedProps.get('_hass') as HomeAssistantExt | undefined;
        if (oldHass) {
            for (const entity of entities) {
                if ((oldHass.states[entity] !== this._hass!.states[entity])) {
                    return true
                }
            }
        }
        return false;
    }

    get _area(): string {
        if (!this.config || !this._hass) {
            return '';
        }

        return this._hass.areas[this.config?.area || '']?.name || 'Моя комната'
    }

    private _click_circle(entity?: string) {
        if (entity) {
            this.dispatchEvent(new CustomEvent("hass-more-info", {
                detail: {entityId: entity},
                bubbles: true,
                composed: true,
                cancelable: false
            }));
        }
    }

    protected render() {
        if (!this.config || !this._hass) {
            return nothing;
        }
        const demo = this.config?.area === undefined

        return html`
            <ha-card class="tion-status-card">
                <p class="tion-card-title">${this._area}</p>
                <div class="card-content">
                    <div class="tion-module-container">
                        <div class="tion-module-item">${this.renderCircle(
                            {
                                name:'Уровень CO₂',
                                entity: this.config.entity_co2,
                                round_multiply: 10,
                                demo,
                                demo_state: {state: "450.0", attributes: {unit_of_measurement: 'ppm'}},
                                max: 2000,
                                min: 0,
                                fallbackState: '———',
                                gradient: true,
                                color_stops: {
                                    '0': '#62e51d',
                                    '1300': '#F97A19',
                                    '1800': '#FF522A',
                                    '2000': '#FF522A',
                                },
                            }
                        )}</div>
                        <div class="tion-module-item">${
                                this.renderCircle({
                                    name: 'Температура',
                                    entity: this.config.entity_temperature,
                                    demo,
                                    demo_state: {state: "25.0", attributes: {unit_of_measurement: '°C'}},
                                    max: 40,
                                    min: 0,
                                    fallbackState: '——',
                                    color: '#ff6600',
                                })
                        }
                        </div>
                        <div class="tion-module-item">${
                                this.renderCircle({
                                    name: 'Влажность',
                                    entity: this.config.entity_humidity,
                                    demo,
                                    demo_state: {state: "27.0", attributes: {unit_of_measurement: '%'}},
                                    max: 100,
                                    min: 0,
                                    fallbackState: '——',
                                    color: '#00b5f2',
                                })
                            }
                        </div>
                    </div>

                    
                    ${this.renderBreezer(demo ? {
                        device: {
                            name: 'Бризер',
                            model: 'Бризер O2'
                        },
                        module: {
                            name: 'MagicAir',
                        },
                        auto: false,
                        target_temp: 20,
                        target_co2: 700,
                        heat_on: true,
                        speed: 1,
                        temp_in: -5,
                        temp_in_unit: '°C',
                        temp_out: 15,
                        temp_out_unit: '°C',
                    }: {
                        device: this._hass?.devices[this.config?.breezer_device||''],
                        module: this._hass?.devices[this.config?.module_device||''],
                        auto: this._hass?.states[this.config?.entity_climate||''].attributes['mode'] === 'auto',
                        target_temp: Math.round(Number(this._hass?.states[this.config?.entity_climate||''].attributes['temperature'])),
                        target_co2: Math.round(Number(this._hass?.states[this.config?.entity_climate||''].attributes['target_co2'])),
                        heat_on: this._hass?.states[this.config?.entity_climate||''].state === 'heat',
                        speed: Math.round(Number(this._hass?.states[this.config?.entity_fan_speed||''].state)),
                        temp_in: Math.round(Number(this._hass?.states[this.config?.entity_t_in||''].state)),
                        temp_in_unit: this._hass?.states[this.config?.entity_t_in||''].attributes['unit_of_measurement'],
                        temp_out: Math.round(Number(this._hass?.states[this.config?.entity_t_out||''].state)),
                        temp_out_unit: this._hass?.states[this.config?.entity_t_out||''].attributes['unit_of_measurement'],
                    })}
                </div>
            </ha-card>
        `
    }

    private renderBreezer(config: {[key:string]: any}) {

        const moduleName = config.module.name;
        const breezerName = config.device.name;
        const breezerModel = config.device.model;
        const target_co2 = config.target_co2;
        const target_temp = config.target_temp;
        const speed = config.speed;
        const temp_in = config.temp_in;
        const temp_in_unit = config.temp_in_unit;
        const temp_out = config.temp_out;
        const temp_out_unit = config.temp_out_unit;
        const heat_on = config.heat_on;
        const auto = config.auto;

        return html`
            <div class="tion-module-info">
                <div class="tion-module-name">${moduleName}</div>
                <div class="tion-module-target"><span>Целевой уровень CO₂ (ppm):</span> ${target_co2}</div>
            </div>
            <div class="tion-breezer-container">
                <div class="tion-breezer-icon">
                    ${this._renderBreezerIcon(breezerModel)}
                </div>
                <div class="tion-breezer-info">
                    <div class="tion-breezer-info-1">
                        <div class="tion-breezer-auto">
                            ${auto ? this._renderAutoIcon() : ''}
                        </div>
                        <div class="tion-breezer-target-temp">
                            <span>Подогрев до</span> ${target_temp}${temp_out_unit}
                        </div>
                    </div>
                    <div class="tion-breezer-speed">
                        ${[1,2,3,4,5].map( (it) => this._renderSpeedSegment(speed >=  it))}
                    </div>
                    <div class="tion-breezer-name">
                        ${breezerName}
                    </div>
                </div>
            </div>
            <div class="tion-temp-container">
                <div class="temperature">${temp_in}${temp_in_unit}</div>
                <div class="arrow-symbol">${this._renderArrow(false)}</div>
                <div class="breezer-symbol">
                    <svg viewBox="0 0 22.0 26.0">
                        <path fill="#00000000" d="M21,22.2C21,23.8 19.7255,25 18.2549,25H3.7451C2.1765,25 1,23.7 1,22.2V3.8C1,2.2 2.2745,1 3.7451,1H18.2549C19.8235,1 21,2.3 21,3.8V22.2Z"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_0"/>
                        <path fill="#00000000" d="M1,17.4001L8.5862,9.7001C9.867,8.4001 12.0345,8.4001 13.4138,9.7001L21,17.4001" stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round"
                              id="path_1"/>
                    </svg>
                </div>
                <div class="arrow-symbol">${this._renderArrow(heat_on)}</div>
                <div class="temperature">${temp_out}${temp_out_unit}</div>
            </div>
        `
    }

    private _renderArrow(hot: boolean) {
        return html`
            <svg viewBox="0 0 21.0 12.0">
                <path fill=${hot ? '#ff6532ff': '#00b5f2ff'}
                      d="M20.5303,6.5303C20.8232,6.2374 20.8232,5.7626 20.5303,5.4697L15.7574,0.6967C15.4645,0.4038 14.9896,0.4038 14.6967,0.6967C14.4038,0.9896 14.4038,1.4645 14.6967,1.7574L18.9393,6L14.6967,10.2426C14.4038,10.5355 14.4038,11.0104 14.6967,11.3033C14.9896,11.5962 15.4645,11.5962 15.7574,11.3033L20.5303,6.5303ZM20,5.25L0,5.25L-0,6.75L20,6.75L20,5.25Z"
                      id="path_0"/>
            </svg>
        `
    }

    private _renderSpeedSegment(on: boolean) {

        return html`
            <svg viewBox="0 0 390.0 130.0">
                <path fill=${on ? '#01b5f2' : '#e3e3e3'}
                      stroke=${(this._hass?.themes?.darkMode || on) ? '#01b5f2' : '#e3e3e3'}
                      fill-opacity=${(this._hass?.themes?.darkMode && !on) ? 0 : 1} 
                      stroke-width="3%" 
                      d="m53,64l-45,-57l330,0l45,57l-45,57l-330,0l45,-57z"/>
            </svg>
        `
    }

    private _renderBreezerIcon(model: string) {
        switch(model){
            case 'Бризер 4S':
                return html`
                    <svg viewBox="0 0 84.0 84.0">
                        <path fill="#00000000" d="M42,42m-41.25,0a41.25,41.25 0,1 1,82.5 0a41.25,41.25 0,1 1,-82.5 0"
                              stroke="#00b5f2ff" stroke-width="1.5" id="path_0"/>
                        <path fill="#00000000" d="M62,62.8058C62,64.6635 60.511,66.1496 58.6496,66.1496H24.4005C22.5391,66.1496 21.05,64.6635 21.05,62.8058V21.1935C21.05,19.3358 22.5391,17.8496 24.4005,17.8496H58.6496C60.511,17.8496 62,19.3358 62,21.1935V62.8058Z"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_1"/>
                        <path fill="#00000000" d="M21.05,49.3502C21.05,49.3502 34.2406,35.063 36.5699,32.54C38.8993,30.017 43.6753,29.502 46.4802,32.54C49.285,35.5781 62,49.3502 62,49.3502"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_2"/>
                        <path fill="#00000000" d="M49.2893,48.8252C49.2893,48.2539 49.1489,47.7424 48.868,47.2909C48.587,46.8347 48.1887,46.4822 47.6729,46.2334C47.1618,45.98 46.5838,45.8533 45.9391,45.8533C44.949,45.8533 44.1454,46.0814 43.5284,46.5375C42.9113,46.9891 42.6027,47.5812 42.6027,48.3138C42.6027,48.7746 42.704,49.1662 42.9067,49.4888C43.1093,49.8113 43.427,50.0947 43.8599,50.3389C45.2769,51.1299 47.0919,50.6958 48.4328,51.7212C49.0963,52.2285 49.3998,52.8317 49.3998,53.6288C49.3998,54.1356 49.2571,54.5849 48.9716,54.9765C48.6861,55.3636 48.2808,55.6631 47.7558,55.875C47.2308,56.087 46.6414,56.193 45.9875,56.193C45.2599,56.193 44.6059,56.0732 44.0257,55.8336C43.4455,55.5894 43.008,55.2438 42.7133,54.7968C42.4231,54.3499 42.2781,53.8223 42.2781,53.2141"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linejoin="round" id="path_3"/>
                        <path fill="#00000000" d="M39.1298,56.4022V45.8533L33.6499,53.4934H40.9468"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linejoin="round" id="path_4"/>
                    </svg>
                `
            case 'Бризер 3S':
                return html`
                    <svg viewBox="0 0 84.0 84.0">
                        <path fill="#00000000" d="M42,42m-41.25,0a41.25,41.25 0,1 1,82.5 0a41.25,41.25 0,1 1,-82.5 0" 
                              stroke="#00b5f2ff" stroke-width="1.5" id="path_0"/>
                        <path fill="#00000000"
                              d="M63.0005,62.806C63.0005,64.6637 61.5114,66.1499 59.65,66.1499H25.4009C23.5396,66.1499 22.0505,64.6637 22.0505,62.806V21.1937C22.0505,19.336 23.5396,17.8499 25.4009,17.8499H59.65C61.5114,17.8499 63.0005,19.336 63.0005,21.1937V62.806Z"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_1"/>
                        <path fill="#00000000"
                              d="M22.0499,49.3502C22.0499,49.3502 35.2404,35.063 37.5698,32.54C39.8991,30.017 44.6752,29.502 47.4801,32.54C50.2849,35.5781 62.9999,49.3502 62.9999,49.3502"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_2"/>
                        <path fill="#00000000"
                              d="M35.4589,48.2223C35.4589,47.3324 36.2155,45.8533 38.3134,45.8533C40.1405,45.8533 40.8971,47.2847 40.8971,48.2223C40.8971,50.2702 39.0528,50.911 37.0194,50.911C38.2016,50.911 41.2281,51.0301 41.2281,53.854C41.2281,55.6825 39.7493,56.4459 38.3134,56.4459C36.8776,56.4459 35.1752,55.7302 35.1752,53.854"
                              stroke="#00b5f2ff" stroke-width="1.5" id="path_3"/>
                        <path fill="#00000000"
                              d="M50.2875,48.8979C50.2875,48.3126 50.1447,47.7886 49.859,47.326C49.5734,46.8587 49.1683,46.4976 48.6438,46.2427C48.124,45.9831 47.5364,45.8533 46.8808,45.8533C45.874,45.8533 45.0568,46.0869 44.4293,46.5543C43.8018,47.0169 43.4881,47.6234 43.4881,48.374C43.4881,48.846 43.5911,49.2473 43.7972,49.5777C44.0032,49.9081 44.3263,50.1984 44.7665,50.4486C46.2074,51.2589 48.053,50.8143 49.4165,51.8647C50.0912,52.3845 50.3999,53.0024 50.3999,53.819C50.3999,54.3382 50.2547,54.7985 49.9644,55.1997C49.674,55.5962 49.262,55.9031 48.7281,56.1202C48.1943,56.3373 47.5949,56.4459 46.9299,56.4459C46.1901,56.4459 45.5251,56.3232 44.9351,56.0777C44.345,55.8275 43.9002,55.4735 43.6005,55.0156C43.3055,54.5577 43.158,54.0173 43.158,53.3942"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linejoin="round" id="path_4"/>
                    </svg>
                `
            default:
                return html`
                    <svg viewBox="0 0 84.0 84.0">
                        <path fill="#00000000" d="M42,42m-41.25,0a41.25,41.25 0,1 1,82.5 0a41.25,41.25 0,1 1,-82.5 0" stroke="#00b5f2ff" stroke-width="1.5" id="path_0"/>
                        <path fill="#00000000" d="M34.4573,26.1284H49.3858" stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_1"/>
                        <path fill="#00000000" d="M20.1567,49.0713H63.6853" stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_2"/>
                        <path fill="#00000000"
                              d="M57.7143,64H26.2857C22.8286,64 20,61.1714 20,57.7143V23.9286C20,21.7286 21.7286,20 23.9286,20H60.0714C62.2714,20 64,21.7286 64,23.9286V57.7143C64,61.1714 61.1714,64 57.7143,64Z"
                              stroke="#00b5f2ff" stroke-width="1.5" stroke-linecap="round" id="path_3"/>
                    </svg>
                `
        }
    }

    private _renderAutoIcon() {
        return html`
            <svg width="300" height="140" viewBox="0 0 300.0 140.0" xmlns="http://www.w3.org/2000/svg">
                <path stroke="#01b5f2" stroke-width="8" fill="#00000000" id="path1" d="M 70 10 a 60 60 0 0 0 0 120 h 160 a 60 60 0 0 0 0 -120 h -160 " />
                <path fill="#01b5f2" d="m 108.64746,90 h -9.433593 l -3.75,-9.755859 H 78.295898 L 74.750977,90 H 65.551758 L 82.280273,47.050781 h 9.169922 z m -15.966796,-16.992188 -5.917969,-15.9375 -5.800781,15.9375 z M 113.18848,47.050781 h 8.67187 V 70.3125 q 0,5.537109 0.32227,7.177734 0.55664,2.636719 2.63672,4.248047 2.10937,1.582031 5.74218,1.582031 3.69141,0 5.56641,-1.49414 1.875,-1.523438 2.25586,-3.720703 0.38086,-2.197266 0.38086,-7.294922 V 47.050781 h 8.67187 v 22.558594 q 0,7.734375 -0.70312,10.927734 -0.70313,3.19336 -2.60742,5.390625 -1.875,2.197266 -5.03907,3.515625 -3.16406,1.289063 -8.26171,1.289063 -6.15235,0 -9.34571,-1.40625 -3.16406,-1.435547 -5.00976,-3.691406 -1.84571,-2.285157 -2.43164,-4.775391 -0.84961,-3.691406 -0.84961,-10.898438 z M 166.24512,90 V 54.316406 h -12.74414 v -7.265625 h 34.13086 v 7.265625 H 174.91699 V 90 Z m 24.14062,-21.210938 q 0,-6.5625 1.96289,-11.015625 1.46485,-3.28125 3.98438,-5.888671 2.54883,-2.607422 5.5664,-3.867188 4.01368,-1.699219 9.25782,-1.699219 9.49218,0 15.17578,5.888672 5.71289,5.888672 5.71289,16.376953 0,10.400391 -5.6543,16.289063 -5.6543,5.859375 -15.11719,5.859375 -9.58007,0 -15.23437,-5.830078 -5.6543,-5.859375 -5.6543,-16.113282 z m 8.93555,-0.292968 q 0,7.294922 3.36914,11.074218 3.36914,3.75 8.55469,3.75 5.18554,0 8.49609,-3.720703 3.33984,-3.75 3.33984,-11.220703 0,-7.382812 -3.25195,-11.015625 -3.22265,-3.632812 -8.58398,-3.632812 -5.36133,0 -8.64258,3.691406 -3.28125,3.662109 -3.28125,11.074219 z"
                      id="text1"
                      aria-label="AUTO" />
            </svg>
        `
    }

    private renderCircle(config: {[key:string]: any}) {
        const state = config.demo ? config.demo_state : this._hass?.states[config?.entity||''] ?? undefined
        const stateVal = state?.state && state?.state != 'unknown' ? state?.state : 0
        const r = 200 * .45;
        const min = config.min || 0;
        const max = config.max || 100;
        const val = this._calculateValueBetween(min, max, stateVal ?? max);
        const score = val * 2 * Math.PI * r;
        const total = 10 * r;
        const dashArray = state?.state && state?.state != 'unknown' ? `${score} ${total}` : `0 ${total}`;

        const stroke_color = config.color_stops ? this._calculateStrokeColor(stateVal, config.color_stops, config.gradient ?? false) : config.color;

        return this._renderCircle({
            state,
            config: {
                ...config,
                stroke_bg_color: this._hass?.themes?.darkMode ? '#333333' : '#eaeaea',
                stroke_color,
            },
            dashArray
        })
    }

    private _calculateStrokeColor(state, stops, gradient: boolean) {
        const sortedStops = Object.keys(stops).map(n => Number(n)).sort((a, b) => a - b);
        const l = sortedStops.length;
        if (state <= sortedStops[0]) {
            return stops[sortedStops[0]];
        } else if (state >= sortedStops[l - 1]) {
            return stops[sortedStops[l - 1]];
        } else {
            let start, end, val;
            for (let i = 0; i < l - 1; i++) {
                const s1 = sortedStops[i];
                const s2 = sortedStops[i + 1];
                if (state >= s1 && state < s2) {
                    [start, end] = [stops[s1], stops[s2]];
                    if (!gradient) {
                        return start;
                    }
                    val = this._calculateValueBetween(s1, s2, state);
                    break;
                }
            }
            return this._getGradientValue(start, end, val);
        }
    }

    private _calculateValueBetween(start, end, val) {
        return (val - start) / (end - start);
    }

    private _getGradientValue(colorA, colorB, val) {
        const v1 = 1 - val;
        const v2 = val;
        const decA = this._hexColorToDecimal(colorA);
        const decB = this._hexColorToDecimal(colorB);
        const rDec = Math.floor((decA[0] * v1) + (decB[0] * v2));
        const gDec = Math.floor((decA[1] * v1) + (decB[1] * v2));
        const bDec = Math.floor((decA[2] * v1) + (decB[2] * v2));
        const rHex = this._padZero(rDec.toString(16));
        const gHex = this._padZero(gDec.toString(16));
        const bHex = this._padZero(bDec.toString(16));
        return `#${rHex}${gHex}${bHex}`;
    }

    private _hexColorToDecimal(color) {
        let c = color.substring(1);
        if (c.length === 3) {
            c = `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
        }

        const [r, g, b] = c.match(/.{2}/g);
        return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
    }

    private _padZero(val) {
        if (val.length < 2) {
            val = `0${val}`;
        }
        return val.substr(0, 2);
    }

    private _renderCircle({ state, dashArray, config }) {
        let stateval;
        if (state === undefined) {
            stateval = undefined;
        } else {
            const multiplier = config.round_multiply ?? 1;
            stateval = Math.floor(state.state / multiplier) * multiplier;
        }

        return html`
            <div class="container" @click=${() => this._click_circle(config.entity)}>
                <svg viewbox="0 0 200 200">
                    <circle cx="50%" cy="50%" r="45%"
                            fill="${'rgba(0, 0, 0, 0)'}"
                            stroke="${config.stroke_bg_color}"
                            stroke-width="${6}"
                            transform="rotate(-90 100 100)"/>
                    <circle cx="50%" cy="50%" r="45%"
                            fill="${'rgba(0, 0, 0, 0)'}"
                            stroke="${config.stroke_color}"
                            stroke-dasharray="${dashArray}"
                            stroke-width="${6}"
                            transform="rotate(-90 100 100)"/>
                </svg>
                <span class="labelContainer">
                  ${config.name != null ? html`<span class="name">${config.name}</span>` : ''}
                  <span class="value">
                    <span class="text">${stateval ? stateval : config.fallbackState}</span>
                    <span class="unit">${config.units ? config.units : (state?.attributes.unit_of_measurement || '')}</span>
                  </span>
                </span>
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
          .card-content {
            container-type: inline-size;
          }
          .tion-card-title {
            width: 100%;
            font-size: 18px;
            line-height: 36px;
            padding: 8px 16px 16px;
            margin: 0px;
            text-align: left;
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .tion-module-container {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            flex-wrap: nowrap;
          }
          .tion-module-item {
            width: 100%;
            text-align: center;
          }
          .tion-module-container .container {
            position: relative;
            height: 100%;
            width: 86%;
            margin-bottom: 20%;
            left: 7%;
            display: flex;
            flex-direction: column;
            container-type: inline-size;
            cursor: pointer;
          }
          .tion-module-container .labelContainer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .tion-module-container .labelContainer .value {
            display: flex;
            line-height: 1;
          }
          .tion-module-container .labelContainer .value, .tion-module-container .labelContainer .name {
            margin: 1% 0;
          }
          .tion-module-container .labelContainer .text {
            font-size: 25cqw;
          }
          .tion-module-container .labelContainer .unit {
            font-size: 12cqw;
          }
          .tion-module-container .labelContainer .name {
            font-size: 12cqw;
            position: absolute;
            top: 85%;
            color: #999;
          }
          .tion-module-container .labelContainer .value span {
            position: absolute;
            left: 0;
            width: 100%;
            text-align: center;
          }
          .tion-module-container .labelContainer .value .text {
            font-weight: normal;
            top: 25%;
          }
          .tion-module-container .labelContainer .value .unit {
            font-weight: normal;
            top: 46%;
            color: #999;
          }
          .tion-module-info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding-top: 6cqw;
          }
          .tion-module-info .tion-module-name {
            font-size: 4cqw;
          }
          .tion-module-info .tion-module-target {
            font-size: 4cqw;
          }
          .tion-module-info .tion-module-target span {
            color: #999;
          }
          .tion-breezer-container {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            flex-wrap: nowrap;
            padding-top: 6cqw; 
            container-type: inline-size;
          }
          .tion-breezer-icon {
            width: 30cqw;
          }
          .tion-breezer-info {
            width: 100%;
            display: flex;
            flex-direction: column;
            container-type: inline-size;
            align-items: stretch;
            align-content: stretch;
            justify-content: space-between;
          }
          .tion-breezer-info-1 {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding-left: 4cqw;
          }
          .tion-breezer-auto svg {
            width: 15cqw;
            height: auto;
          }
          .tion-breezer-name {
            text-align: left;
            padding-left: 1em;
            font-size: 4cqw;
          }
          .tion-breezer-target-temp {
            text-align: right;
            padding-left: 1em;
            font-size: 4cqw;
          }
          
          .tion-breezer-target-temp span{
            color: #999;
          }
          .tion-breezer-speed {
            display: flex;
            flex-wrap: nowrap;
            padding-left: 4cqw; 
          }
          .tion-breezer-speed > svg {
            padding: 0.5cqw;
          }
          .tion-temp-container {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: center;
            align-items: center;
            padding-top: 6cqw; 
            container-type: inline-size;
          }
          .tion-temp-container > div {
            align-self: center;
          }
          .tion-temp-container .temperature {
            font-size: 5cqw;
          }
          .tion-temp-container .breezer-symbol {
            width: 6cqw;
          }
          .tion-temp-container .arrow-symbol {
            width: 6cqw;
            padding: 0px 3cqw;
          }
          svg {
            display: block;
          }
        `;
    }
}

@customElement("tion-status-card-editor")
class TionStatusCardEditor extends LitElement {
    @property({attribute: false}) public hass?: HomeAssistantExt;
    @state() private _config?: CustomCardConfig;

    private _initialized = false

    static get properties() {
        return {
            hass: {},
            _config: {},
        };
    }

    private _initialize(): void {
        if (this.hass === undefined || this._config === undefined) {
            return;
        }
        this._initialized = true;
    }

    protected shouldUpdate(): boolean {
        if (!this._initialized) {
            this._initialize();
        }
        return true;
    }

    setConfig(config) {
        this._config = config;
    }

    private _inputChanged(ev) {
        ev.stopPropagation();
        const target = ev.target as any;
        const value = ev.detail ? ev.detail.value : target.value;

        let _config
        if (value && this._config) {
            const devices = Object.keys(this.hass?.devices || {}).filter((it) => {
                return this.hass?.devices[it].area_id === value
                    && this.hass?.devices[it].manufacturer === 'TION'
                    && (['MagicAir', 'Модуль CO2+'].indexOf(this.hass?.devices[it].model || '-') !== -1);
            })
            const co2re = /_co2(_\d+)?$/
            const tempre = /_temperature(_\d+)?$/
            const humre = /_humidity(_\d+)?$/
            const mod_ent_names = Object.keys(this.hass?.entities || {}).filter((it) => {
                return devices.indexOf(this.hass?.entities[it]?.device_id || '-') !== -1
                    && [co2re, tempre, humre].filter((pr) => pr.test(it))
            })
            const entities = {}
            for (const i in mod_ent_names) {
                const id = mod_ent_names[i]
                if (co2re.test(id)) {
                    entities['entity_co2'] = id;
                } else if (tempre.test(id)) {
                    entities['entity_temperature'] = id;
                } else if (humre.test(id)) {
                    entities['entity_humidity'] = id;
                }
            }
            const breezers = Object.keys(this.hass?.devices || {}).filter((it) => {
                return this.hass?.devices[it].area_id === value
                    && this.hass?.devices[it].manufacturer === 'TION'
                    && (['Бризер O2', 'Бризер 3S', 'Бризер 4S'].indexOf(this.hass?.devices[it].model || '-') !== -1);
            })
            const climate_re = /climate\./
            const speed_re = /_speed(_\d+)?$/
            const t_in_re = /_temperature_in(_\d+)?$/
            const t_out_re = /_temperature_out(_\d+)?$/
            const br_ent_names = Object.keys(this.hass?.entities || {}).filter((it) => {
                return breezers.indexOf(this.hass?.entities[it]?.device_id || '-') !== -1
                    && [climate_re, speed_re, t_in_re, t_out_re].filter((pr) => pr.test(it))
            })
            for (const i in br_ent_names) {
                const id = br_ent_names[i]
                if (climate_re.test(id)) {
                    entities['entity_climate'] = id;
                } else if (speed_re.test(id)) {
                    entities['entity_fan_speed'] = id;
                } else if (t_in_re.test(id)) {
                    entities['entity_t_in'] = id;
                } else if (t_out_re.test(id)) {
                    entities['entity_t_out'] = id;
                }
            }

            _config = {
                ...this._config,
                area: value,
                module_device: devices[0],
                breezer_device: breezers[0],
                ...entities,
            }
        } else {
            _config = {
                ...this._config,
                area: undefined,
                module_device: undefined,
                entity_co2: undefined,
                entity_temperature: undefined,
                entity_humidity: undefined,
                breezer_device: undefined,
                entity_climate: undefined,
                entity_fan_speed: undefined,
                entity_t_in: undefined,
                entity_t_out: undefined,
                entity_t_set: undefined,
            }
        }
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: {config: _config},
            bubbles: true,
            composed: true,
        }));
    }

    get _area(): string {
        return this._config?.area || '';
    }

    protected render() {

        return html`
            <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                        area: {
                            device: {
                                integration: "tion"
                            }
                        },
                    }}
                    .value=${this._area}
                    .required=${true}
                    @value-changed=${this._inputChanged}
            ></ha-selector>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "tion-status-card": TionStatusCard;
        "tion-status-card-editor": TionStatusCardEditor;
    }
}

const theWindow = window as any;
theWindow.customCards = theWindow.customCards || [];
theWindow.customCards.push({
    type: "tion-status-card",
    name: "Tion Status Card",
    preview: true,
    description: "Карточка для отображения статусов бризера и модуля. Карточка максимально приближена к форме обзора в официальном приложении Tion MagicAir.",
    documentationURL: "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/",
});
