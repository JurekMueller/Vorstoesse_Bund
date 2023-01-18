import pandas as pd
import numpy as np
from pathlib import Path
import json
import re
import requests
import itertools
import time
import pickle
import urllib
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from os import path

import warnings
warnings.filterwarnings("ignore")

 
# ### API Parlamentsdienste


def parse_date(date):
    if date is None or pd.isnull(date): return None
    stamp= re.findall(r'-?\d+', date)[0]
    conv = int(stamp[:-3])
    return datetime.fromtimestamp(conv).date()


first_leg = 47

 
# #### Liste der Legislaturperioden


# Das gibt alle Legislaturperioden
headers = {"Accept": "application/json"} # Request json file

api_url = "https://ws.parlament.ch/odata.svc/LegislativePeriod"
params = {'$filter':f"Language eq 'DE' and LegislativePeriodNumber ge {first_leg}",'$orderby':'ID'} # Council == 1 ist Nationalrat, == 2 ist Ständerat
# params = urllib.parse.urlencode(params, quote_via=urllib.parse.quote,safe='/:') # turns spaces into %20, the encoding that the server expects
response = requests.get(api_url,headers=headers,params=params)
# print(response.json()['d'][0])
response = response.json()['d'] # resoponse somehow is id object "d"
response_pd = pd.json_normalize(response)

response_sel = response_pd[['ID','StartDate','EndDate']]
response_sel['StartDate'] = response_sel['StartDate'].apply(parse_date)
response_sel['EndDate'] = response_sel['EndDate'].apply(parse_date)
response_sel = response_sel.set_index('ID',drop=False)
legislaturen = response_sel



legislaturen_out = legislaturen.copy(deep=True)
legislaturen_out['StartDate'] = legislaturen_out['StartDate'].apply(lambda x: x.year)
legislaturen_out['EndDate'] = legislaturen_out['EndDate'].apply(lambda x: x.year)


with open(f"../Data/legislatures.json", "w") as file:
   json.dump(legislaturen_out.to_dict(orient='records'), file) # default str makes everything that can not be serialized into a string (for example a date)


# ## Subjects

        
# Create Subject File for request_leg


headers = {"Accept": "application/json"} # Request json file

api_url = "https://ws.parlament.ch/odata.svc/Tags"
params = {'$orderby':'ID'}
# params = urllib.parse.urlencode(params, quote_via=urllib.parse.quote,safe='/:') # turns spaces into %20, the encoding that the server expects
response = requests.get(api_url,headers=headers,params=params)
# print(response.json()['d'][0])
response = response.json()['d']['results'] # resoponse somehow is id object "d"
response_pd = pd.json_normalize(response)

response_sel = response_pd[['ID','Language','TagName']]
response_sel = response_sel[(response_sel['Language']=='DE') | (response_sel['Language']=='FR')]
response_sel = response_sel.pivot(index='ID', columns='Language')['TagName']
response_sel = response_sel.rename({'DE':'de','FR':'fr'},axis=1)
response_sel = response_sel.sort_values('de')
response_sel = pd.concat([pd.DataFrame([{'de':'Alle Themen','fr':'Tous les thèmes'}]),response_sel],ignore_index=True)
topics = response_sel

with open(f"../Data/topics.json", "w") as file:
   json.dump(topics.to_dict(orient='records'), file)

# loop over councils (1: Nationalrat, 2: Ständerat)
for council in [1,2]:
    print('Working on council:',council)
    # #### Liste der Abgeordneten (History)


    # Das gibt alle Abgeordneten die jemals im Nationalrat sassen
    # Hier können auch Abgeordnete auftauchen die zum aktuellen Zeitpunkt noch nicht Teil des Nationalrats sind (wen sie jemanden anderen zu einem bestimmten Tag in der Zukunft ersetzen z.B Marc Jost)
    headers = {"Accept": "application/json"} # Request json file

    api_url = "https://ws.parlament.ch/odata.svc/MemberCouncilHistory"

    repeat = True
    skip = 0
    interval = 1500
    abgeordnete_hist = None
    while repeat:
        
        params = {'$top':str(interval),'$skip':str(skip),'$filter':f"Language eq 'DE' and Council eq {council}"} # Council == 1 ist Nationalrat, == 2 ist Ständerat
        response = requests.get(api_url,headers=headers,params=params)
        response = response.json()['d']
        response_pd = pd.json_normalize(response)
        if abgeordnete_hist is None: abgeordnete_hist = response_pd.copy(deep=True)
        else: abgeordnete_hist = pd.concat([abgeordnete_hist,response_pd],ignore_index=True)
        if len(response_pd) < interval: 
            repeat=False
        else: skip += interval

    abgeordnete_hist_sel = abgeordnete_hist[['PersonNumber','FirstName','LastName','GenderAsString','CantonName','ParlGroupAbbreviation','ParlGroupName','PartyAbbreviation','DateElection','DateJoining','DateLeaving']]
    abgeordnete_hist_sel['DateJoining'] = abgeordnete_hist_sel['DateJoining'].apply(parse_date)
    abgeordnete_hist_sel['DateLeaving'] = abgeordnete_hist_sel['DateLeaving'].apply(parse_date)
    abgeordnete_hist_sel['DateElection'] = abgeordnete_hist_sel['DateElection'].apply(parse_date)
    abgeordnete_hist_sel = abgeordnete_hist_sel.sort_values(['PersonNumber','DateJoining'])
    abgeordnete_hist_sel = abgeordnete_hist_sel.drop_duplicates(['PersonNumber','DateLeaving','DateJoining'],keep='last') # Einige Einträge können doppelt vorkommen durch änderungen in nicht relevanten spalten (e.g. Mitglied wurde zu Präsident oder Umzug etc.), Einige sind doppelt in relevanten Spalten (e.g. Parteiwechsel) allerdings gibt es keine Informationen über die Reihenfolge wechsel von wo nach wo..

    
    # #### Liste der Abgeordneten


    # Das gibt alle Abgeordneten die jemals im Nationalrat sassen
    # Hier können auch Abgeordnete auftauchen die zum aktuellen Zeitpunkt noch nicht Teil des Nationalrats sind (wen sie jemanden anderen zu einem bestimmten Tag in der Zukunft ersetzen z.B Marc Jost)
    headers = {"Accept": "application/json"} # Request json file

    api_url = "https://ws.parlament.ch/odata.svc/MemberCouncil"

    repeat = True
    skip = 0
    abgeordnete = None
    interval = 1000
    while repeat:
        
        params = {  '$top':str(interval),'$skip':str(skip),
                    '$filter':f"Language eq 'DE' and \
                    (DateLeaving ge datetime'{legislaturen.loc[first_leg]['StartDate']}' or DateJoining ge datetime'{legislaturen.loc[first_leg]['StartDate']}')",
                    '$orderby':'PersonNumber asc'}
        response = requests.get(api_url,headers=headers,params=params)
        response = response.json()['d']
        response_pd = pd.json_normalize(response)
        if abgeordnete is None: abgeordnete = response_pd.copy(deep=True)
        else: abgeordnete = pd.concat([abgeordnete,response_pd],ignore_index=True)
        if len(response_pd) < interval: 
            repeat=False
        else: skip += interval

    abgeordnete = abgeordnete[abgeordnete.apply(lambda x: x['PersonNumber'] in abgeordnete_hist_sel['PersonNumber'].unique(),axis=1)] # select only the ones that at one time sat in the selected council
    abgeordnete_sel = abgeordnete[['PersonNumber','FirstName','LastName','GenderAsString','CantonName','ParlGroupAbbreviation','PartyAbbreviation']]
    # abgeordnete_sel = abgeordnete[['PersonNumber','FirstName','LastName','GenderAsString','CantonName','ParlGroupAbbreviation','PartyAbbreviation','DateElection','DateJoining','DateLeaving']]
    # abgeordnete_sel['DateJoining'] = abgeordnete_sel['DateJoining'].apply(parse_date)
    # abgeordnete_sel['DateLeaving'] = abgeordnete_sel['DateLeaving'].apply(parse_date)
    # abgeordnete_sel['DateElection'] = abgeordnete_sel['DateElection'].apply(parse_date)
    abgeordnete_sel = abgeordnete_sel.sort_values(['PersonNumber'])
    abgeordnete_sel = abgeordnete_sel.set_index('PersonNumber',drop=False)
    abgeordnete_sel['GenderAsString'] = abgeordnete_sel['GenderAsString'].apply(lambda x: 'weiblich' if (x=='f') else 'männlich')



    
    # ### Liste der Legislaturperioden pro Abgeordnete:n und Anzahl der Dienstjahre und Partei pro Legislatur


    def agg_parties(party,leg):
        # aggregate small regional parties to their corresponding national parties to reduce number of parties
        if party == 'CSI': return 'CSP'
        elif party == 'CSPO' and leg<51: return 'CVP'
        elif party == 'CSPO' and leg>=51: return 'M-E'
        elif party == 'CVPO' and leg<51: return 'CVP'
        elif party == 'CVPO' and leg>=51: return 'M-E'
        elif party == 'LDP' and leg>=48: return 'FDP-Liberale'
        elif party == 'GB': return 'GRÜNE'
        elif party == 'BastA': return 'GRÜNE'
        elif party == 'Al' and leg>=48: return 'GRÜNE'

        # change Name of Paries that just renamed themselves to newest name
        # This illustrates the coninuity and avoids confusion
        elif party == 'GPS': return 'GRÜNE'
        elif party == 'MCR': return 'MCG'
        elif party == 'CVP' and leg>=51: return 'M-E'
        elif party == 'BDP' and leg>=51: return 'M-E'
        elif party == 'FDP' and leg>=48: return 'FDP-Liberale'
        else: return party


    # person_numbers = abgeordnete_hist_sel['PersonNumber'].unique()
    person_numbers = abgeordnete_sel.index
    abgeordnete_sel['Legislaturen'] = None # needs to be initialized as datatype object to be able to assign lists
    abgeordnete_sel['DienstjahreTot'] = None
    abgeordnete_sel['DienstjahreLeg'] = None
    abgeordnete_sel['PartyAbbreviation'] = abgeordnete_sel['PartyAbbreviation'].astype(object)
    abgeordnete_sel['ParlGroupAbbreviation'] = abgeordnete_sel['ParlGroupAbbreviation'].astype(object)
    abgeordnete_sel['CantonName'] = abgeordnete_sel['CantonName'].astype(object)
    for p in person_numbers:
    # for p in [277]:
        individual = abgeordnete_hist_sel[abgeordnete_hist_sel['PersonNumber']==p]
        legs = []
        tot_service_count = 0
        tot_service = {} # Dictionary der bisherigen Dienstzeit pro Legislatur
        leg_service = {} # Dictionary der Dienstzeit pro Legislatur
        leg_party = {}
        leg_parlg = {}
        leg_canton = {}
        for index, leg in individual.iterrows():
            before = 0
            service = 0
            
            # liste der Legislaturen im Amt
            legs_entry = legislaturen[ ( ((leg['DateJoining']>=legislaturen['StartDate']) & (leg['DateJoining']<legislaturen['EndDate'])) |
                                                        ((leg['DateLeaving']>(legislaturen['StartDate']) + timedelta(days=1)) & (leg['DateLeaving']<=legislaturen['EndDate'])) ) | # Subtract one day from Date Leaving to counter some bad data where DateLeaving (add to Start Date) is larger than StartDate of next Leg (see 249)
                                                        ((leg['DateJoining']<=legislaturen['StartDate']) & (leg['DateLeaving']>=legislaturen['EndDate'])) |
                                                    (( ((leg['DateJoining']>=legislaturen['StartDate']) & (leg['DateJoining']<legislaturen['EndDate'])) |
                                                        (leg['DateJoining']<=legislaturen['StartDate']) ) & (leg['DateLeaving'] is None) )]['ID'].values
            legs = legs + list(legs_entry)

            # Berechnung Dienstzeit 
            # check if member befor first leg
            if leg['DateJoining'] <= legislaturen.loc[first_leg]['StartDate']:
                if leg['DateLeaving'] <= legislaturen.loc[first_leg]['StartDate']:
                    before = (leg['DateLeaving'] - leg['DateJoining']).days / 365.25 # transform from days to years. Not fully acurate but close enough.
                else: # includes also time in first_leg. Leg or later
                    before = (legislaturen.loc[first_leg]['StartDate'] - leg['DateJoining']).days / 365.25
            tot_service_count += before
            # check time in each Legislatur that the entry covers
            for l in legs_entry:
                # Start date
                if leg['DateJoining'] <= legislaturen.loc[l]['StartDate']: startdate = legislaturen.loc[l]['StartDate'] # Sometimes entries span larger timespans including years befor Leg 45 eg. 39
                else: startdate = leg['DateJoining']
                
                # End date
                if leg['DateLeaving'] is None: enddate = date.today()
                elif leg['DateLeaving'] >= legislaturen.loc[l]['EndDate']: enddate = legislaturen.loc[l]['EndDate']
                else: enddate = leg['DateLeaving']

                service = (enddate - startdate).days / 365.25 
                if str(l) in leg_service.keys():
                    # if the entry change in Member History happens during the legislative period, two entries overlap with the same leg period. The service time from both entries thus has to be added.
                    leg_service[str(l)] += service
                else:
                    leg_service[str(l)] = service
                tot_service_count += service
                tot_service[str(l)] = tot_service_count
                # If still in current Leg then take data from MemberCouncil (more recent)
                if leg['DateLeaving'] is not None:
                    leg_party[str(l)] = agg_parties(leg['PartyAbbreviation'],l)
                    leg_parlg[str(l)] = leg['ParlGroupAbbreviation']
                    leg_canton[str(l)] = leg['CantonName']
                else:
                    leg_party[str(l)] = agg_parties(abgeordnete_sel.loc[leg['PersonNumber']]['PartyAbbreviation'],l)
                    leg_parlg[str(l)] = abgeordnete_sel.loc[leg['PersonNumber']]['ParlGroupAbbreviation']
                    leg_canton[str(l)] = abgeordnete_sel.loc[leg['PersonNumber']]['CantonName']
        legs = np.unique(legs)
        abgeordnete_sel.at[p,'Legislaturen'] = [l.item() for l in legs] # need to use at instead of loc to assign lists, use .item() to convert numpy int to int
        abgeordnete_sel.at[p,'DienstjahreTot'] = tot_service
        abgeordnete_sel.at[p,'DienstjahreLeg'] = leg_service
        abgeordnete_sel.at[p,'PartyAbbreviation'] = leg_party
        abgeordnete_sel.at[p,'ParlGroupAbbreviation'] = leg_parlg
        abgeordnete_sel.at[p,'CantonName'] = leg_canton

    
    
    # Loop over legislatures
    for request_leg in legislaturen.ID:
        # ### Reduce to selected Leg
        if path.isfile(f"../Data/netzwerk_{request_leg}_{council}.json") and request_leg!=legislaturen.ID.iloc[-1]: #update the last leg
            print(f"File for leg {request_leg} already exists")
            continue
        else:
            print("Working on Legislature:",request_leg)
        abgeordnete_sel_leg = abgeordnete_sel[abgeordnete_sel['Legislaturen'].apply(lambda x: request_leg in x)]
        abgeordnete_sel_leg['DienstjahreTot'] = abgeordnete_sel_leg['DienstjahreTot'].apply(lambda x: x[str(request_leg)])
        abgeordnete_sel_leg['DienstjahreLeg'] = abgeordnete_sel_leg['DienstjahreLeg'].apply(lambda x: x[str(request_leg)])
        abgeordnete_sel_leg['PartyAbbreviation'] = abgeordnete_sel_leg['PartyAbbreviation'].apply(lambda x: x[str(request_leg)])
        abgeordnete_sel_leg['ParlGroupAbbreviation'] = abgeordnete_sel_leg['ParlGroupAbbreviation'].apply(lambda x: x[str(request_leg)])
        abgeordnete_sel_leg['CantonName'] = abgeordnete_sel_leg['CantonName'].apply(lambda x: x[str(request_leg)])
        abgeordnete_sel_leg = abgeordnete_sel_leg.rename({'PartyAbbreviation':'Partei','ParlGroupAbbreviation':'Fraktion','GenderAsString':'Geschlecht','PersonNumber':'id'},axis=1)

        
        # **Testing**


        # Test if there are doubles in the IDs
        print('Test1:')
        if len(abgeordnete_sel['PersonNumber'].unique()) != len(abgeordnete_sel['PersonNumber']):
            print('Error')
        else:
            print('OK')


        # Test if there are still Legislaturen counted double
        test = abgeordnete_sel.copy(deep=True)
        test['debug'] = test.apply(lambda x: len(x['Legislaturen']) != len(set(x['Legislaturen'])),axis=1)
        test[test['debug']==True]


        # Test if there are entries with empty Legislaturen
        test = abgeordnete_sel_leg.copy(deep=True)
        test['debug'] = test.apply(lambda x: len(x['Legislaturen']) == 0,axis=1)
        test[test['debug']==True]

        
        # ## Vorstösse


        # Das gibt alle Abgeordneten die jemals im Nationalrat sassen
        # Hier können auch Abgeordnete auftauchen die zum aktuellen Zeitpunkt noch nicht Teil des Nationalrats sind (wen sie jemanden anderen zu einem bestimmten Tag in der Zukunft ersetzen z.B Marc Jost)
        headers = {"Accept": "application/json"} # Request json file

        api_url = "https://ws.parlament.ch/odata.svc/Business"

        types = ['Motion','Parlamentarische Initiative','Postulat','Interpellation','Dringliche Interpellation','Anfrage','Dringliche Anfrage','Fragestunde. Frage']  


        list_halves=[]
        for halve in [1,2]:
            print('Working on halve',halve)
            if halve == 1:
                start_date = legislaturen.loc[request_leg]['StartDate']
                end_date = legislaturen.loc[request_leg]['StartDate'] + relativedelta(years=2)
            elif halve ==2:
                start_date = legislaturen.loc[request_leg]['StartDate'] + relativedelta(years=2)
                end_date = legislaturen.loc[request_leg]['EndDate'] 
            repeat = True
            skip = 0
            business = None
            retries = 0 # counter for 
            interval = 1000 # number of entries requested in one request
            while repeat:
                params = {'$top':str(interval),'$skip':str(skip),'$filter':  f"Language eq 'DE' and \
                                                        SubmissionCouncil eq {council} and \
                                                        SubmissionDate ge datetime'{start_date}' and \
                                                        SubmissionDate lt datetime'{end_date}'",
                                                        '$orderby':'SubmissionDate asc',
                                                        '$expand':'BusinessRoles'}
                response = requests.get(api_url,headers=headers,params=params)    
                try: # check if successfull
                    response = response.json()['d']['results'] # varialbe results only exists if expand is used or top is not used
                except:
                    time.sleep(2)
                    retries += 1
                    print(f'Request failed at skipt {skip}. Retries: {retries}')
                    if retries == 5: 
                        interval -= 100
                        if interval == 0:
                            raise RuntimeError('Request failed too many times')
                        else:
                            retries = 0
                            print(f'try with new interval: {interval}')
                            continue
                        
                    else: continue # try the same request again (max 10 times)
                retries = 0 # reset retries for the next request
                response_pd = pd.json_normalize(response)
                if business is None: business = response_pd.copy(deep=True)
                else: business = pd.concat([business,response_pd],ignore_index=True)
                if len(response_pd) < interval: 
                    repeat=False
                else: skip += interval # Limit sind 1000 pro Abfrage aber führt oft zu timeout
            list_halves.append(business[business['BusinessTypeName'].isin(types)])
        # business_tot = business[business['BusinessTypeName'].isin(types)]
        business_tot = pd.concat(list_halves,ignore_index=True)
        # pickle.dump(business_tot,open(f"../Data/business_{request_leg}_{council}.pkl", "wb"))

        def normalize_roles(df):
            out = pd.json_normalize(df)
            if list(pd.json_normalize(df).columns) == []: return None
            else:
                out = out[['MemberCouncilNumber','RoleName']]
                out = out[(out['RoleName']=='Mitunterzeichner(-in)') | (out['RoleName'] == 'Urheber(-in)')] # Filter out something like Bekämpfer(-in)
                out = out.rename({'MemberCouncilNumber':'PersonNumber'},axis=1)
                out = out.set_index('PersonNumber',drop=False)
                return out

        def split_tags(tag):
            if tag is None: return ['Ohne Thema']
            else: return tag.split('|')

        def merge_types(type):
            if type == 'Dringliche Anfrage': return 'Anfrage'
            elif type == 'Dringliche Interpellation': return 'Interpellation'
            else: return type

        business_sel = business_tot[business_tot['SubmittedBy'].str.contains("nationalrat|kommission|fraktion",case=False)==False]
        # business_sel = business_tot[['BusinessShortNumber','Title','SubmittedBy','SubmissionDate','SubmissionLegislativePeriod','BusinessTypeName','ResponsibleDepartmentName','ResponsibleDepartmentAbbreviation','TagNames','BusinessRoles.results']]
        # business_sel = business_tot[['BusinessShortNumber','Title','SubmittedBy','BusinessTypeName','TagNames','BusinessRoles.results']]
        business_sel = business_sel[['BusinessShortNumber','BusinessTypeName','TagNames','BusinessRoles.results']]
        # business_sel['SubmissionDate'] = business_sel['SubmissionDate'].apply(parse_date)
        business_sel['BusinessRoles.results'] = business_sel['BusinessRoles.results'].apply(normalize_roles)
        business_sel = business_sel.rename({'BusinessRoles.results':'BusinessRoles'},axis=1)
        business_sel = business_sel.set_index('BusinessShortNumber',drop=False)
        business_sel['TagNames'] = business_sel['TagNames'].apply(split_tags) # Transform Tags to list
        business_sel = business_sel.rename({'BusinessShortNumber':'id','BusinessTypeName':'Type','TagNames':'Thema'},axis=1)
        business_sel['Type'] = business_sel['Type'].apply(merge_types) # Merge Urgent with normal businesses

        
        # ### Testing

        
        # Check if there are Roles that are not assigned to a Person or Roles that we do not expect
        print('Test2:')

        for b, bus in business_sel.iterrows():
            if not bus['BusinessRoles']['PersonNumber'].all(): print(b)

        for b, bus in business_sel.iterrows():
            if not bus['BusinessRoles']['PersonNumber'].all(): print(b)


        for b, bus in business_sel.iterrows():
            if bus['Type']=='Dringliche Anfrage': print(b)


        # Check if there are some businesses without tags
        business_sel[business_sel['Thema'].isnull()]


        for b, bus in business_sel.iterrows():
            if 'Bekämpfer(-in)' in bus['BusinessRoles']['RoleName'].values: print(b)


        for b, bus in business_sel.iterrows():
            if len(bus['BusinessRoles'])==0: print(b)


        
        # ### Add Businesses to Abg List


        collab = {}
        lead = {}
        for b, bus in business_sel.iterrows():
            for a, abg in bus['BusinessRoles'].iterrows():
                if abg['RoleName'] == 'Mitunterzeichner(-in)' or abg['RoleName'] == 'Urheber(-in)':
                    if a in collab.keys(): collab[a].append(b)
                    else: collab[a] = [b]
                if abg['RoleName'] == 'Urheber(-in)':
                    if a in lead.keys(): lead[a].append(b)
                    else: lead[a] = [b]

        abgeordnete_sel_leg['Lead'] = None
        abgeordnete_sel_leg['Collab'] = None
        for a,abg in abgeordnete_sel_leg.iterrows():
            if a in collab.keys(): abgeordnete_sel_leg.at[a,'Collab'] = business_sel.loc[collab[a]].drop('BusinessRoles',axis=1)
            if a in lead.keys(): abgeordnete_sel_leg.at[a,'Lead'] = business_sel.loc[lead[a]].drop('BusinessRoles',axis=1)

        
        # ## Links
        # 


        # Speeeeed
        links = {}
        business_sel_iter = business_sel[business_sel['BusinessRoles'].apply(lambda x: len(x)>1)]
        # business_sel_iter = business_sel[business_sel['BusinessRoles'].apply(lambda x: len(x)>1 and len(x)<=20)] # only compute links for businesses with more than one contributer

        for b, bus in business_sel_iter.iterrows():
        # for b, bus in business_sel.iterrows():
            comb = list(itertools.combinations(bus['BusinessRoles']['PersonNumber'].values, 2))
            add = bus.drop('BusinessRoles').to_dict()
            for l in comb:
                # if link does not already exist, create new one
                if str(l) not in links.keys():
                    sameParty = abgeordnete_sel_leg.loc[l[0]].Partei == abgeordnete_sel_leg.loc[l[1]].Partei
                    links[str(l)] = {'source':int(l[0]),'target':int(l[1]),'sameParty':sameParty,'value':[add]}
                # if link already exists, append business to it
                else:
                    links[str(l)]['value'].append(add)
        links = list(links.values())


        # ## Nodes

        
        # Need to do this after Businesses there information is added

        
        # Bring into dict form


        nodes = abgeordnete_sel_leg.copy(deep=True)
        def jsonifiy(df):
            if df is None: return []
            else: return df.to_dict(orient='records')
        nodes['Lead'] = nodes['Lead'].apply(jsonifiy)
        nodes['Collab'] = nodes['Collab'].apply(jsonifiy)
        nodes = nodes.to_dict(orient='records')

        
        # ### Save to json


        netzwerk = dict(nodes=nodes,links=links)
        with open(f"../Data/netzwerk_{request_leg}_{council}.json", "w") as file:
            json.dump(netzwerk, file) # default str makes everything that can not be serialized into a string (for example a date)


