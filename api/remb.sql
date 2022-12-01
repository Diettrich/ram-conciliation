/****** Script for SelectTopNRows command from SSMS  ******/
IF OBJECT_ID('tempdb..#tempTicketRemb') IS NOT NULL DROP TABLE #tempTicketRemb;
IF OBJECT_ID('tempdb..#tempBINGA') IS NOT NULL DROP TABLE #tempBINGA;
IF OBJECT_ID('tempdb..#tempOGONE') IS NOT NULL DROP TABLE #tempOGONE;
IF OBJECT_ID('tempdb..#tempCMI') IS NOT NULL DROP TABLE #tempCMI;
IF OBJECT_ID('tempdb..#tempAPP') IS NOT NULL DROP TABLE #tempAPP;
IF OBJECT_ID('tempdb..#tempthunes') IS NOT NULL DROP TABLE #tempthunes;
IF OBJECT_ID('tempdb..#tempFatourati') IS NOT NULL DROP TABLE #tempFatourati;
IF OBJECT_ID('tempdb..#tempALL') IS NOT NULL DROP TABLE #tempALL;
/******** Altea Rrtraitement ********/
IF OBJECT_ID('tempdb..#tempTicket') IS NOT NULL DROP TABLE #tempTicket;
SELECT convert(date, [issue date]) as [issue date],
    [PNR],
    [IOI],
    [Entité],
    sum(convert(float, [Total])) as [Total],
    [Devise] Into #tempTicketRemb
FROM [Altea].[dbo].[tickets]
    left join [Tickets].[dbo].[Iata-Codes] on [IATA Code] = [IOI]
where [TRNC] = 'RFND'
group by [issue date],
    [PNR],
    [Entité],
    [IOI],
    [Devise]
    /* Select * From #tempTicket */
    /******** APP Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempAPP') IS NOT NULL DROP TABLE #tempAPP;
SELECT g.[PNR],
    g.[Payment Date] as [PAYDATE],
    g.[Marché] as [Country],
    sum(g.[Montant]) as [Amount],
    g.[Currency] as [Devise],
    g.[Canal] Into #tempAPP
From (
        SELECT [ReferenceIDRecLoc] as [PNR],
            convert(
                date,
                concat(
                    left([Timestamp], 4),
                    '/',
                    SUBSTRING([Timestamp], 5, 2),
                    '/',
                    SUBSTRING([Timestamp], 7, 2)
                )
            ) as [Payment Date],
            b.[Country] as [Marché],
            case
                When (
                    [OfficeID] like 'AMMAT%'
                    or [OfficeID] like 'TUNAT%'
                ) then sum(convert(float, [Value])) / 1000
                When (
                    [OfficeID] like 'DKRAT%'
                    or [OfficeID] like 'ABJAT%'
                    or [OfficeID] like 'DLAAT%'
                ) then sum(convert(float, [Value]))
                Else sum(convert(float, [Value])) / 100
            End as [Montant],
            [Currency],
            [Canal] = 'APP'
        FROM [APP].[dbo].[APP]
            Left join [Tickets].[dbo].['City-code$'] b on [Code] = left([OfficeID], 3)
        Where [SubType] in ('OR', 'RC')
            and [Status] = 'OK'
            and [ProviderCode] in ('AX', 'BI', 'WD')
        Group by [ReferenceIDRecLoc],
            [Timestamp],
            [Currency],
            b.[Country],
            [OfficeID]
    ) as g
Group by [PNR],
    [Payment Date],
    [Marché],
    [Currency],
    [Canal] -- Select * From #tempAPP
    /******** OGONE Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempOGONE') IS NOT NULL DROP TABLE #tempOGONE;
SELECT LEFT([REF], 6) as PNR,
    convert(date, [PAYDATE]) as [PAYDATE],
    b.[Country],
    Case
        when [ORIGINAL_CUR] = '' then sum([TOTAL])
        Else sum([ORIGINAL_AMOUNT])
    End as [Amount],
    Case
        when [ORIGINAL_CUR] = '' then [CUR]
        Else [ORIGINAL_CUR]
    End as [Devise],
    [Canal] = 'OGONE' Into #tempOGONE
FROM [OGONE ].[dbo].[OGONE]
    left join [Tickets].[dbo].[Country_codes$] b on SUBSTRING([MERCHREF], 4, 2) = [Country Code]
Where [LIB] = 'Remboursement'
group by LEFT([REF], 6),
    [PAYDATE],
    b.[Country],
    [CUR],
    [ORIGINAL_CUR]
    /* Select * From #tempOGONE */
    /******** CMI Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempCMI') IS NOT NULL DROP TABLE #tempCMI;
Select PNR,
    [Date de la transaction] as [PAYDATE],
    [Marché] as [Country],
    sum([Montant]) as [Amount],
    [Devise],
    [Canal] into #tempCMI
from (
        SELECT case
                when len(
                    REPLACE(
                        REPLACE([Numéro de la commande], '-', ''),
                        ' ',
                        ''
                    )
                ) = 6 then REPLACE(
                    REPLACE([Numéro de la commande], '-', ''),
                    ' ',
                    ''
                )
                when len(
                    LEFT(
                        REPLACE(
                            REPLACE([Numéro de la commande], '-', ''),
                            ' ',
                            ''
                        ),
                        CHARINDEX(
                            '_',
                            REPLACE(
                                REPLACE([Numéro de la commande], '-', ''),
                                ' ',
                                ''
                            )
                        )
                    )
                ) = 7 then LEFT(
                    REPLACE(
                        REPLACE([Numéro de la commande], '-', ''),
                        ' ',
                        ''
                    ),
                    CHARINDEX(
                        '_',
                        REPLACE(
                            REPLACE([Numéro de la commande], '-', ''),
                            ' ',
                            ''
                        )
                    ) -1
                )
                else RIGHT(REPLACE([Numéro de la commande], ' ', ''), 6)
            end as PNR,
            convert(date, LEFT([Date de la transaction], 10)) as [Date de la transaction],
            iif (
                [Devise] = 'MAD',
                'Morocco',
                iif(
                    [Devise] = 'CAD',
                    'CANADA',
                    iif(
                        [Devise] = 'EUR',
                        'France',
                        iif(
                            [Devise] = 'USD',
                            'United States',
                            iif(
                                [Devise] = 'GBP',
                                'United Kingdom',
                                iif([Devise] = 'CHF', 'Switzerland', '')
                            )
                        )
                    )
                )
            ) as [Marché],
            [Montant],
            [Devise],
            [Canal] = 'CMI'
        FROM [CMI].[dbo].[CMI]
        Where [Type de la transaction] = 'Remboursement'
            and [Nom de la société] in (
                'RAM AGENT PAY',
                'RAM CALL CENTER',
                'RAM CALL CENTER CAD',
                'RAM CALL CENTER EUR',
                'RAM CALL CENTER USD',
                'RAM CALL CENTER GBP',
                'RAM CALL CENTER CHF',
                'RAM eRetail',
                'RAM INTERNET ECOM',
                'RAM INTERNET UPGRADE'
            )
            and [Etat de la transaction] = 'Réussi'
    ) a
group by PNR,
    [Date de la transaction],
    [Devise],
    [Marché],
    [Canal] --    Select * From #tempCMI
    /******** Thunes Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempthunes') IS NOT NULL DROP TABLE #tempthunes;
Select [PNR],
    [Date de création] as [PAYDATE],
    [Marché] as [Country],
    sum([Montant]) as [Amount],
    [Devise] = '',
    [Canal] = 'Thunes' into #tempThunes
From(
        SELECT [Réf# commande marchand] as [PNR],
            convert(date, [Date de création]) as [Date de création],
            iif(
                [Marchand] = 'Royal Air Maroc',
                'France',
                iif(
                    [Marchand] = 'Royal Air Maroc DE',
                    'Allemagne',
                    iif([Marchand] = 'Royal Air Maroc UK', 'UK', '')
                )
            ) as [Marché],
            [Montant]
        FROM [Thunes ].[dbo].[thunes$]
        Where [Type] = 'Recrédit'
    ) a
Group by [PNR],
    [Date de création],
    [Marché] -- Select * From #tempThunes
    /******** BINGA Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempBINGA') IS NOT NULL DROP TABLE #tempBINGA;
Select [N° PNR] as [PNR],
    [Payment Date] as [PAYDATE],
    [Country] = 'Morocco',
    sum([Amount]) as [Amount],
    [Devise] = 'MAD' COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal] = 'BINGA' into #tempBINGA
from (
        SELECT [N° PNR],
            convert(
                date,
                REPLACE(
                    SUBSTRING(
                        [Payment Date],
                        LEN(
                            LEFT(
                                [Payment Date],
                                CHARINDEX(' ', [Payment Date]) + 1
                            )
                        ),
                        LEN([Payment Date]) - LEN(
                            LEFT([Payment Date], CHARINDEX(' ', [Payment Date]))
                        ) - LEN(
                            RIGHT(
                                [Payment Date],
                                CHARINDEX(' ', (REVERSE([Payment Date])))
                            )
                        )
                    ),
                    '-',
                    '/'
                )
            ) AS [Payment Date] --   ,[Marché]='Morocco'
,
            [Amount] --   ,[Devise]='MAD'
            --   ,[Canal]='BINGA'
        From (
                SELECT *
                FROM [Binga].[dbo].[BingaCall]
                Union all
                SELECT *
                FROM [Binga].[dbo].[BingaINT]
            ) as tmp
        Where [Status] in ('PAID', 'ISSUED')
    ) as temp2
Group by [N° PNR],
    [Payment Date] --    ,[Marché]
    --    ,[Devise]
    --    ,[Canal]
    -- COLLATE SQL_Latin1_General_CP1_CI_AS
    -- Select * From #tempBINGA
    /******** Fatourati Rrtraitement ********/
    IF OBJECT_ID('tempdb..#tempFatourati') IS NOT NULL DROP TABLE #tempFatourati;
Select [PNR],
    [Date de la facture] as [PAYDATE],
    [Marché] as [Country],
    sum([Montant de la commande]) as [Amount],
    [Devise],
    [Canal] into #tempFatourati
From (
        select [PNR],
            convert(date, [Date de la facture]) as [Date de la facture],
            [Marché] = 'Morocco',
            [Montant de la commande],
            [Devise] = 'MAD',
            [Canal] = 'Fatourati'
        From [Fatourati ].[dbo].[Fatourati$]
        where [Banque ou canal de paiement] <> ''
    ) a
Group by [PNR],
    [Date de la facture],
    [Marché],
    [Devise],
    [Canal] -- Select * from #tempFatourati
    /****** Retraitement ******/
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS [Country],
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS [Devise],
    [Canal] Into #tempALL from #tempBINGA
UNION all
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal]
from #tempOGONE
UNION all
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal]
from #tempCMI
UNION all
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal]
from #tempAPP
UNION all
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal]
from #tempThunes
UNION all
select [PNR],
    [PAYDATE],
    [Country] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Amount],
    [Devise] COLLATE SQL_Latin1_General_CP1_CI_AS,
    [Canal]
from #tempFatourati;
    -- SELECT	* Into #tempALL
    -- From #tempBINGA 
    -- Union all 
    -- select* from #tempOGONE 
    -- Union all 
    -- select* from #tempCMI
    -- Union all 
    -- select* from #tempAPP
    -- Union all 
    -- select* from #tempThunes
    -- Union all 
    -- select* from #tempFatourati
    -- Select * From #tempALL
    -- Select * From #tempTicketRemb
    -- /******  Regroupement ******/
    Use [Tickets]
go
IF OBJECT_ID('[dbo].[Réconciliation]') IS NOT NULL DROP TABLE [dbo].[Réconciliation];
CREATE TABLE [dbo].[Réconciliation](
    [PAYDATE] [datetime] NULL,
    [PNR] [varchar](50) NULL,
    [Entité] [varchar](50) NULL,
    [Total] [decimal](18, 2) NULL,
    [Devise_Altea] [varchar](50) NULL,
    [Canal] [varchar](50) NULL,
    [Amount_Canal] [decimal](18, 2) NULL,
    [Devise_Canal] [varchar](50) NULL,
    [ecart] [decimal](18, 2) NULL,
    [type] [varchar](50) NULL,
) ON [PRIMARY]
SELECT [issue date] as [PAYDATE],
    a.[PNR],
    [Entité],
    [Total] as [Amount_Altea],
    a.[Devise] as [Devise_Altea],
    b.[Canal],
    round([Amount], 2) as [Amount_Canal],
    b.[Devise] as [Devise_Canal],
    round([Amount] - [Total], 2) as ecart --   into #tempRembourssement
FROM #tempTicketRemb a
    inner join #tempALL b on a.[PNR]=b.[PNR]
    --    and convert(datetime,[PAYDATE],103)=convert(datetime,[issue date] ,103)
    --   Select * from  #tempRembourssement
insert into [dbo].[Réconciliation]
select *
from (
        SELECT [issue date] as [PAYDATE],
            a.[PNR],
            [Entité],
            [Total] as [Amount_Altea],
            a.[Devise] as [Devise_Altea],
            b.[Canal],
            round([Amount], 2) as [Amount_Canal],
            b.[Devise] as [Devise_Canal],
            round([Amount] - [Total], 2) as ecart,
            --   into #tempRembourssement
            'Remboursement' as [type]
        FROM #tempTicketRemb a
            inner join #tempALL b on a.[PNR]=b.[PNR]) k