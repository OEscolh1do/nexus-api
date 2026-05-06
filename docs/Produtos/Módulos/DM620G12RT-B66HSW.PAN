PVObject_=pvModule
  Version=7.4.5
  Flags=$00908043

  PVObject_Commercial=pvCommercial
    Comment=www.dmegcsolar.com  (China)
    Flags=$0041
    Manufacturer=DMEGC
    Model=DM620G12RT-B66HSW
    DataSource=Manufacturer
    YearBeg=2023
    Width=1.134
    Height=2.382
    Depth=0.030
    Weight=32.300
    NPieces=100
    PriceDate=24/08/23 14:38
    Remarks, Count=5
      Str_1=框架: anodized alu
      Str_2=结构:2.0 mm tempered
      Str_3=连接: TUV
      Str_4
      Str_5
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=620.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.780
  Isc=16.110
  Voc=49.09
  Imp=15.200
  Vmp=40.85
  muISC=7.73
  muVocSpec=-121.0
  muPmpReq=-0.290
  RShunt=800
  Rp_0=30000
  Rp_Exp=5.50
  RSerie=0.199
  Gamma=1.051
  muGamma=-0.0004
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=16.308
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellWidth=0.182
  CellHeight=0.092
  LIDLoss=1.00
  SandiaAMCorr=50.000
  RelEffic800=0.36
  RelEffic600=0.31
  RelEffic400=0.10
  RelEffic200=-1.27

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=65.0,0.99100
      Point_5=70.0,0.97400
      Point_6=75.0,0.95300
      Point_7=80.0,0.89200
      Point_8=85.0,0.74600
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=5 tOperPoint
    Point_1=True,1000,25.0,0.00,49.09,16.110,15.200,40.85,620.92
    Point_2=False,800,25.0,0.36,0.00,0.000,0.000,0.00,498.66
    Point_3=False,600,25.0,0.31,0.00,0.000,0.000,0.00,373.81
    Point_4=False,400,25.0,0.10,0.00,0.000,0.000,0.00,248.68
    Point_5=False,200,25.0,-1.27,0.00,0.000,0.000,0.00,122.64
  End of List OperPoints
End of PVObject pvModule
