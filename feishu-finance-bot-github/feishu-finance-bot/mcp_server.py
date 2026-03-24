#!/usr/bin/env python3
"""
财务数据 MCP Server (Python + requests)
使用公开 API 获取 A 股/港股/美股实时财务数据

备用数据源：
- 腾讯财经
- 网易财经  
- 雪球
"""

import json
import sys
import requests
import re
from datetime import datetime

# 设置请求头，模拟浏览器
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# ============ 数据获取函数 ============

def get_stock_info_tencent(stock_code: str) -> dict:
    """获取股票基本信息（腾讯财经）"""
    try:
        # 处理 A 股代码
        symbol = stock_code
        if stock_code.isdigit() and len(stock_code) == 6:
            symbol = f"sh{stock_code}" if stock_code.startswith('6') else f"sz{stock_code}"
        
        url = f"https://qt.gtimg.cn/q={symbol}"
        response = requests.get(url, headers=HEADERS, timeout=5)
        response.encoding = 'gbk'
        
        # 解析腾讯格式：v_sh600519="51~贵州茅台~600519~1680.00~..."
        match = re.search(r'"([^"]+)"', response.text)
        if match:
            parts = match.group(1).split('~')
            if len(parts) >= 5:
                name = parts[1] or stock_code
                price = float(parts[3]) if parts[3] else 0
                prev_close = float(parts[4]) if parts[4] else price
                change = ((price - prev_close) / prev_close * 100) if prev_close else 0
                
                return {
                    "name": name,
                    "code": stock_code,
                    "market": "沪市" if stock_code.startswith('6') else "深市",
                    "price": round(price, 2),
                    "change": round(change, 2),
                }
        
        return {"name": stock_code, "code": stock_code, "market": "未知"}
    except Exception as e:
        return {"error": str(e), "code": stock_code}


def get_stock_info_sina(stock_code: str) -> dict:
    """获取股票基本信息（新浪财经）"""
    try:
        symbol = stock_code
        if stock_code.isdigit() and len(stock_code) == 6:
            symbol = f"sh{stock_code}" if stock_code.startswith('6') else f"sz{stock_code}"
        
        url = f"https://quote.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getStockListData?symbol={symbol}"
        response = requests.get(url, headers=HEADERS, timeout=5)
        data = response.json()
        
        if data and len(data) > 0:
            item = data[0]
            return {
                "name": item.get('name', stock_code),
                "code": stock_code,
                "market": "沪市" if stock_code.startswith('6') else "深市",
                "price": float(item.get('price', 0)),
                "change": float(item.get('changepercent', 0)),
            }
        
        return {"name": stock_code, "code": stock_code, "market": "未知"}
    except Exception as e:
        return {"error": str(e), "code": stock_code}


def get_financial_summary_eastmoney(stock_code: str) -> dict:
    """获取财务摘要（东方财富 API）"""
    try:
        symbol = stock_code
        if stock_code.isdigit() and len(stock_code) == 6:
            symbol = f"SH{stock_code}" if stock_code.startswith('6') else f"SZ{stock_code}"
        
        # 东方财富 F10 财务指标
        url = f"https://emweb.eastmoney.com/PC_HSF10/FinanceAnalysis/Index?type=web&code={symbol}"
        response = requests.get(url, headers=HEADERS, timeout=5)
        data = response.json()
        
        if data.get('data'):
            finance = data['data']
            # 尝试不同字段名
            return {
                "roe": finance.get('ROE', finance.get('roe', 'N/A')),
                "gross_margin": finance.get('GROSS_MARGIN', finance.get('grossMargin', 'N/A')),
                "net_margin": finance.get('NET_MARGIN', finance.get('netMargin', 'N/A')),
                "debt_ratio": finance.get('DEBT_RATIO', finance.get('debtRatio', 'N/A')),
                "revenue_growth": finance.get('REVENUE_GROWTH', finance.get('revenueGrowth', 'N/A')),
                "profit_growth": finance.get('PROFIT_GROWTH', finance.get('profitGrowth', 'N/A')),
                "eps": finance.get('EPS', finance.get('eps', 'N/A')),
                "pe": finance.get('PE', finance.get('pe', 'N/A')),
                "pb": finance.get('PB', finance.get('pb', 'N/A')),
            }
        
        return {"note": "详细财务数据获取中"}
    except Exception as e:
        return {"note": "财务数据暂不可用", "error": str(e)}


def get_financial_summary_sina(stock_code: str) -> dict:
    """获取财务摘要（新浪财经 API）"""
    try:
        symbol = stock_code
        if stock_code.isdigit() and len(stock_code) == 6:
            symbol = f"sh{stock_code}" if stock_code.startswith('6') else f"sz{stock_code}"
        
        url = f"https://money.finance.sina.com.cn/corp/go.php/vFD_FinanceSummary/stockid/{stock_code}.phtml"
        response = requests.get(url, headers=HEADERS, timeout=5)
        
        # 简单解析 HTML 表格（简化版）
        # 实际应该用 BeautifulSoup，但这里简化处理
        return {
            "note": "财务数据获取中",
            "code": stock_code
        }
    except Exception as e:
        return {"note": "财务数据暂不可用", "error": str(e)}


def get_stock_info(stock_code: str) -> dict:
    """获取股票基本信息（多数据源）"""
    # 尝试腾讯
    result = get_stock_info_tencent(stock_code)
    if result.get('name') and result['name'] != stock_code:
        return result
    
    # 尝试新浪
    result = get_stock_info_sina(stock_code)
    if result.get('name') and result['name'] != stock_code:
        return result
    
    return {"name": stock_code, "code": stock_code, "market": "未知"}


def get_financial_summary(stock_code: str) -> dict:
    """获取财务摘要（多数据源）"""
    # 尝试东方财富
    result = get_financial_summary_eastmoney(stock_code)
    if result.get('roe') and result['roe'] != 'N/A':
        return result
    
    # 尝试新浪
    result = get_financial_summary_sina(stock_code)
    if result.get('roe') and result['roe'] != 'N/A':
        return result
    
    return {"note": "财务数据获取中"}


def get_business_overview(stock_code: str) -> dict:
    """获取业务概况"""
    return {
        "industry": "待获取",
        "main_business": "待获取",
        "employees": "待获取",
        "founded": "待获取"
    }


def analyze_risks(financials: dict) -> list:
    """分析风险因素"""
    risks = []
    
    try:
        debt_ratio = float(financials.get('debt_ratio', 0)) if financials.get('debt_ratio') not in ['N/A', None, '待获取'] else 0
        if debt_ratio > 70:
            risks.append("资产负债率较高 (>70%)，存在偿债风险")
        
        revenue_growth = float(financials.get('revenue_growth', 0)) if financials.get('revenue_growth') not in ['N/A', None, '待获取'] else 0
        if revenue_growth < 0:
            risks.append("营业收入负增长，业务可能萎缩")
        
        profit_growth = float(financials.get('profit_growth', 0)) if financials.get('profit_growth') not in ['N/A', None, '待获取'] else 0
        if profit_growth < 0:
            risks.append("净利润负增长，盈利能力下降")
        
        roe = float(financials.get('roe', 0)) if financials.get('roe') not in ['N/A', None, '待获取'] else 0
        if roe < 5:
            risks.append("ROE 较低 (<5%)，股东回报率不高")
        
        if not risks:
            risks.append("暂无显著财务风险信号")
    except:
        risks.append("风险分析中")
    
    return risks


def analyze_highlights(financials: dict, stock_info: dict) -> list:
    """分析亮点"""
    highlights = []
    
    try:
        roe = float(financials.get('roe', 0)) if financials.get('roe') not in ['N/A', None, '待获取'] else 0
        gross_margin = float(financials.get('gross_margin', 0)) if financials.get('gross_margin') not in ['N/A', None, '待获取'] else 0
        debt_ratio = float(financials.get('debt_ratio', 0)) if financials.get('debt_ratio') not in ['N/A', None, '待获取'] else 0
        revenue_growth = float(financials.get('revenue_growth', 0)) if financials.get('revenue_growth') not in ['N/A', None, '待获取'] else 0
        profit_growth = float(financials.get('profit_growth', 0)) if financials.get('profit_growth') not in ['N/A', None, '待获取'] else 0
        
        if roe > 20:
            highlights.append(f"ROE 优异 ({roe}%)，股东回报率高")
        if gross_margin > 50:
            highlights.append(f"毛利率高 ({gross_margin}%)，产品竞争力强")
        if debt_ratio < 40:
            highlights.append(f"资产负债率低 ({debt_ratio}%)，财务结构稳健")
        if revenue_growth > 30:
            highlights.append(f"营收增长快 ({revenue_growth}%)，业务扩张迅速")
        if profit_growth > 30:
            highlights.append(f"利润增长快 ({profit_growth}%)，盈利能力增强")
        
        if not highlights:
            highlights.append("经营稳定")
    except:
        highlights.append("亮点分析中")
    
    return highlights


def generate_one_pager(stock_code: str) -> str:
    """生成 One Pager 结构化报告"""
    stock_info = get_stock_info(stock_code)
    financials = get_financial_summary(stock_code)
    business = get_business_overview(stock_code)
    
    risks = analyze_risks(financials)
    highlights = analyze_highlights(financials, stock_info)
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    price_str = f"¥{stock_info.get('price', 'N/A')}" if stock_info.get('price') else "N/A"
    change_str = f"{stock_info.get('change', 0)}%" if stock_info.get('change') is not None else "0%"
    
    report = f"""📊 **{stock_info.get('name', stock_code)} ({stock_info.get('code', stock_code)})**

🏢 **公司概况**
- 市场：{stock_info.get('market', 'N/A')}
- 现价：{price_str} ({change_str})
- 行业：{business.get('industry', '待获取')}

💰 **核心财务指标**
- ROE: {financials.get('roe', 'N/A')}%
- 毛利率：{financials.get('gross_margin', 'N/A')}%
- 净利率：{financials.get('net_margin', 'N/A')}%
- 资产负债率：{financials.get('debt_ratio', 'N/A')}%
- 营收增长率：{financials.get('revenue_growth', 'N/A')}%
- 净利润增长率：{financials.get('profit_growth', 'N/A')}%
- 每股收益：{financials.get('eps', 'N/A')}
- 市盈率：{financials.get('pe', 'N/A')}
- 市净率：{financials.get('pb', 'N/A')}

✨ **亮点**
{chr(10).join(f'- {h}' for h in highlights)}

⚠️ **风险**
{chr(10).join(f'- {r}' for r in risks)}

_数据更新时间：{now}_
_数据来源：腾讯财经、东方财富_"""
    
    return report


# ============ MCP 协议处理 ============

def handle_request(request: dict) -> dict:
    """处理 MCP 请求"""
    method = request.get("method", "")
    params = request.get("params", {})
    
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "tools": [
                    {
                        "name": "get_stock_info",
                        "description": "获取股票基本信息（名称、价格、市场）",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码（如 600519、AAPL）"}
                            },
                            "required": ["stock_code"]
                        }
                    },
                    {
                        "name": "get_financial_summary",
                        "description": "获取财务摘要（ROE、毛利率、增长率等）",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码"}
                            },
                            "required": ["stock_code"]
                        }
                    },
                    {
                        "name": "generate_one_pager",
                        "description": "生成完整的财报 One Pager 报告",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "stock_code": {"type": "string", "description": "股票代码或公司名称"}
                            },
                            "required": ["stock_code"]
                        }
                    }
                ]
            }
        }
    
    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})
        
        if tool_name == "get_stock_info":
            result = get_stock_info(args.get("stock_code", ""))
        elif tool_name == "get_financial_summary":
            result = get_financial_summary(args.get("stock_code", ""))
        elif tool_name == "generate_one_pager":
            result = {"report": generate_one_pager(args.get("stock_code", ""))}
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]
            }
        }
    
    elif method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "finance-mcp-python", "version": "1.0.0"}
            }
        }
    
    else:
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "error": {"code": -32601, "message": f"Method not found: {method}"}
        }


def main():
    """主循环：读取 stdin，处理 MCP 请求，输出到 stdout"""
    print(json.dumps({"status": "started", "timestamp": datetime.now().isoformat()}), file=sys.stderr, flush=True)
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            request = json.loads(line.strip())
            response = handle_request(request)
            print(json.dumps(response, ensure_ascii=False), flush=True)
        except json.JSONDecodeError:
            continue
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(e)}
            }
            print(json.dumps(error_response), flush=True)


if __name__ == "__main__":
    main()
